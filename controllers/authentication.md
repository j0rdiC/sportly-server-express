# JWT authencation, access and tokens.

## Index

- [Defining the user model](#1-defining-the-user-model)
- [Registering the user](#2-registering-the-user)
- [Authenticating the user](#3-authenticating-the-user-login)

---

## 1. Defining the user model

- Define the User schema which will include the generate access and refresh token methods.
- Define a validation schema for the user registration with the Joi library.
- The mongoose Schema class takes an options object as its second argument where we can define this methods.
- The generateAcessToken method will generate and return a JWT token with the user id and the user role as the payload.
- The generateRefreshToken method will generate a JWT token with the user id as the payload and save the token in the database.
- If we wanted the users to be able to login from multiple devices we would save the refresh tokens in an array and change the implementation.

```js
const { Schema, model } = require('mongoose')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const config = require('config')

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 5, maxlength: 1024 },
    firstName: String,
    lastName: String,

    isAdmin: { type: Boolean, default: false },
    refreshToken: String,
  },

  {
    timestamps: {
      createdAt: '_createdAt',
      updatedAt: '_updatedAt',
    },

    methods: {
      generateAccessToken: function () {
        return jwt.sign(
          {
            _id: this._id,
            isAdmin: this.isAdmin,
          },
          config.get('jwtAKey'),
          { expiresIn: '5m' }
        )
      },

      generateRefreshToken: async function () {
        const token = jwt.sign({ _id: this._id }, config.get('jwtRKey'), { expiresIn: '90d' })

        this.refreshToken = token
        await this.save()

        return token
      },
    },
  }
)

const User = model('User', userSchema)

const validate = (email, password) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(5).max(1024).required(),
  })

  return schema.validate({ email, password })
}

module.exports = { User, validate }
```

---

## 2. Registering the user

- Validate the user input
- Check if the user already exists
- Create a new user with hashed password

```js
const registerUser = async (req, res) => {
  const { email, password } = req.body

  const { error } = validate(email, password)
  if (error) return validationErr(res, error)

  let user = await User.findOne({ email })
  if (user) return res.status(400).send({ message: 'User already registered.' })

  const salt = await bcrypt.genSalt(10)
  const hashed = await bcrypt.hash(password, salt)

  user = new User({ email, password: hashed })
  await user.save()

  res.status(201).send(_.pick(user, ['_id', 'email']))
}
```

---

## 3. Authenticating the user (login)

- Validate the user input.
- Check if the user exists.
- Check if the password is correct.
- Generate the access and refresh tokens (remember the refresh token will be saved in the database).
- Return the access and refresh tokens.

```js
const loginUser = async (req, res) => {
  const { email, password } = req.body

  const { error } = validate(email, password)
  if (error) return validationErr(res, error)

  const invalidAuth = () => res.status(400).send({ message: 'Invalid email or password.' })

  const user = await User.findOne({ email })
  if (!user) return invalidAuth()

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return invalidAuth()

  const access = user.generateAccessToken()
  const refresh = await user.generateRefreshToken()

  res.send({ access, refresh })
}
```

---

## 4. Refreshing the access token

- Validate the refresh token.
- Decode the refresh token to get the user id.
- Check if the user exists.
- Generate new access and refresh tokens (remember the refresh token will be saved in the database).
- Since this is for a mobile app only one device will be used to login, so we can overwrite the refresh token in the database.

```js
const refreshUser = async (req, res) => {
  jwt.verify(req.body.refresh, config.get('jwtRKey'), async (err, decoded) => {
    if (err) return res.status(403).send({ message: `Refresh ${err.message}.` })

    const user = await User.findById(decoded._id)
    if (!user) return res.status(403).send({ message: 'Invalid refresh token.' })

    const access = user.generateAccessToken()
    const refresh = await user.generateRefreshToken()

    return res.send({ access, refresh })
  })
}
```

I see a lot of people checking if the refresh token of the user is the same as the one in the request, but I think this is not necessary since json web tokens guarantee uniqueness and the user can only have one refresh token at a time.

---

## 5. Accessing protected routes

- Create a middleware function to check if the user is authenticated.
- If the user is authenticated we add the user id and the user role to the request object.
- Send 401 if the user is not authenticated. This number is important because it will be used in the client with axios interceptors.

```js
module.exports = (req, res, next) => {
  const token = req.header('Authorization')
  if (!token) return res.status(401).send({ message: 'Unauthorized. No token provided.' })

  jwt.verify(token, config.get('jwtAKey'), (err, decoded) => {
    if (err) return res.status(401).send({ message: `Unauthorized. ${capitalize(err.message)}.` })

    req.user = decoded
    next()
  })
}
```

- Create a middleware function to check if the user is an admin.
- Send 403 if the user is not an admin.

```js
module.exports = (req, res, next) => {
  if (!req.user.isAdmin) return res.status(403).send({ message: 'Access denied.' })

  next()
}
```

---

## 6. Putting it all together

- Auth endpoints (register, login, refresh).

```js
const router = require('express').Router()
const { loginUser, registerUser, refreshUser } = require('../controllers/auth-control')

router.post('/', loginUser)
router.post('/register', registerUser)
router.post('/refresh', refreshUser)

module.exports = router
```

- A nice end point to interact with the current logged in user ".../api/users/me". You can imagine how the other http methods are implemented.

```js
// --- Controller ---
const getUser = async (req, res) => {
  const user = await User.findById(req.user._id)

  res.send(_.pick(user, ['_id', 'email', 'firstName', 'lastName', '_createdAt']))
}

// --- Route ---
const router = require('express').Router()
const auth = require('../middleware/auth')
const { getUser, updateUser, deleteUser, listUsers } = require('../controllers/users-control')

// prettier-ignore
router.route('/me')
  .get(auth, getUser)
  .put(auth, updateUser)
  .delete(auth, deleteUser)

module.exports = router
```

Sorry for the prettier-ignore, but it's actually necessary.

---

## Cron job to delete expired refresh tokens

- Since a malicious user with a refresh token can generate new access tokens, we need to delete the refresh tokens that have expired from the databse.

```js

```

---

## Comments

- I looked at two different approaches:

1. Creating a new collection for the refresh tokens with the user id and the token itself
   - Using mongoose TTL to delete the refresh token after a certain time
