# JWT Authentication, access token, refresh token, and logout.

## Index

- [Defining the user model](#defining-the-user-model)

## Defining the schema

- Define the User schema which will include the generate access and refresh token methods.
- The mongoose Schema class takes an options object as its second argument where we can define this methods.
- The generateAcessToken method will generate a JWT token with the user id and the user role as the payload.
- The generateRefreshToken method will generate a JWT token with the user id as the payload.
- The generateRefreshToken method will also save the token to the database.
- Define a validation schema for the user registration with the Joi library.

```javascript
const { Schema, model } = require('mongoose')
const jwt = require('jsonwebtoken')
const Joi = require('joi')

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 5, maxlength: 1024 },
    firstName: String,
    lastName: String,
    isAdmin: { type: Boolean, default: false },
    // ...

    refreshToken: {
      iv: String,
      content: String,
    },
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
          { expiresIn: '30s' }
        )
      },

      generateRefreshToken: function () {
        return jwt.sign({ _id: this._id }, config.get('jwtRKey'), { expiresIn: '90d' })
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

There are a lot of ways of apporaching this. But I like to keep the refresh token in the database. This way I can revoke the token if I want to. I also like to encrypt the refresh token before saving it to the database. But this is not necessary.

## Authenticating the user (login).

- Validate the user input.
- Check if the user exists.
- Check if the password is correct.
- Generate the access and refresh tokens.
- Save the refresh token to the database.
- Return the access and refresh tokens.

```javascript
// auth-controller.js
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
  const refresh = user.generateRefreshToken()

  const hashed = encrypt(refresh)
  await user.updateOne({ refreshToken: hashed })

  res.send({ access, refresh: hashed })
}
```

- Validation error and encrypt / decrypt helper functions.
- Remember the shape of the refresh token in the database: {
  iv: String,
  content: String
  }.

```javascript
// helpers.js
const validationErr = (res, error) => res.status(400).send({ message: error.details[0].message })

// hash.js
const algorithm = 'aes-256-ctr'
const secretKey = crypto.randomBytes(32)

const encrypt = (data) => {
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, secretKey, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  }
}

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'))
  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()])

  return decrpyted.toString()
}

module.exports = { encrypt, decrypt }
```

## Refreshing the access token

- Decrypt the refresh token.
- Validate the refresh token.
- Check if the user with the id exists.
- Generate new access and refresh tokens.
- Save the new refresh token to the database.
- Return the new access and refresh tokens.

```javascript
// auth-controller.js
const refreshUser = async (req, res) => {
  const refreshToken = decrypt(req.body.refresh)

  jwt.verify(refreshToken, config.get('jwtRKey'), async (err, decoded) => {
    if (err) return res.status(403).send({ message: `Refresh ${capitalize(err.message)}.` })

    const user = await User.findById(decoded._id)
    if (!user) return res.status(403).send({ message: 'Invalid refresh token.' })

    const access = user.generateAccessToken()
    const refresh = user.generateRefreshToken()

    const hashed = encrypt(refresh)
    await user.updateOne({ refreshToken: hashed })

    return res.send({ access, refresh: hashed })
  })
}
```

## Putting it all together

```javascript
// routes/auth.js
const router = require('express').Router()
const { loginUser, registerUser, refreshUser } = require('../controllers/auth-control')

router.post('/', loginUser)
router.post('/register', registerUser)
router.post('/refresh', refreshUser)

module.exports = router

// startup/routes.js
module.exports = (app) => {
  app.use('/api/auth', require('../routes/auth'))
  app.use('/api/users', require('../routes/users'))

  app.use(require('../middleware/error'))
}

// server.js
const app = require('express')()

require('./startup/logging')()
require('./startup/middleware')(app)
require('./startup/routes')(app)
require('./startup/database')()

const port = process.env.PORT || 8000
app.listen(port, () => debug(`Server running on port ${port}`))
```

---

## React Native

- To call the server and handle protected routes I use axios interceptors.
- They allow you to intercept requests and responses before they are handled by then or catch.
- If in the first request the response is 401, the interceptor will try to refresh the access token.
- If the refresh token is invalid, the user will be redirected to the login screen.
- I also like to use api-sauce as a wrapper for axios. It makes the code cleaner by giving you an 'ok' boolean value in the response object which will be true if the status code lays between 200 and 299. Avoiding the need for try catch blocks.

```javascript
import axios from 'axios'
import { create } from 'apisauce'
import authStorage from '../auth/storage'
import { BASE_URL } from './client-open'

const baseClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

baseClient.interceptors.request.use(
  async (config) => {
    const { access } = await authStorage.getTokens()
    if (!access) return

    config.headers['Authorization'] = access

    return config
  },
  (error) => Promise.reject(error)
)

baseClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const prevRequest = error.config

    // !prevReq.sent to avoid infinit loop
    if (error.response.status === 401 && !prevRequest.sent) {
      prevRequest.sent = true

      const newAccessToken = await updateAccessToken()

      if (!newAccessToken) return // should logout user

      baseClient.defaults.headers.common['Authorization'] = newAccessToken

      return baseClient(prevRequest)
    }
    return Promise.reject(error)
  }
)

const updateAccessToken = async () => {
  const { refresh } = await authStorage.getTokens()
  const { status, data } = await baseClient.post('/auth/refresh', { refresh })

  if (status !== 200) return

  await authStorage.storeTokens(data)
  return data.access
}

export default privateClient = create({ axiosInstance: baseClient })
```

## Handling the tokens in the mobile-app with expo-secure-store.

- I use expo-secure-store to store the tokens in the mobile app.
- It gives you a simple interface to encrypt, store and retrieve a small amount of data in the secure storage of the device.
- The **getUser** function is called on my app startup to check if the user is logged in and to check if the refresh token expired.
- Let's say the user has not accessed a protected route, or more so has not even used the app for a long time, the refresh token will expire and the user will be logged out.

```javascript
import * as SecureStore from 'expo-secure-store'
import jwtDecode from 'jwt-decode'

const key = 'authTokens'

const storeTokens = async (tokens) => {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(tokens))
  } catch (error) {
    console.log('Error storing the auth token', error)
  }
}

const getTokens = async () => {
  try {
    return JSON.parse(await SecureStore.getItemAsync(key))
  } catch (error) {
    console.log('Error getting the auth token', error)
  }
}

const getUser = async () => {
  try {
    const { access } = await getTokens()
    const valid = await getRefreshTokenValidity()
    return access && valid ? jwtDecode(access) : null
  } catch (error) {
    console.log('No user found', error)
  }
}

const removeTokens = async () => {
  try {
    await SecureStore.deleteItemAsync(key)
  } catch (error) {
    console.log('Error removing the auth token', error)
  }
}

const validateToken = (token) => {
  try {
    const decoded = jwtDecode(token)
    return decoded.exp > Date.now() / 1000
  } catch (error) {
    console.log('Error validating the token', error)
  }
}

const getAccessTokenValidity = async () => {
  try {
    const { access } = await getTokens()
    return access ? validateToken(access) : null
  } catch (error) {
    console.log('Error getting the access token validity', error)
  }
}

const getRefreshTokenValidity = async () => {
  try {
    const { refresh } = await getTokens()
    return refresh ? validateToken(refresh) : null
  } catch (error) {
    console.log('Error getting the refresh token validity')
  }
}

export default {
  getTokens,
  getUser,
  removeTokens,
  storeTokens,
  getAccessTokenValidity,
  getRefreshTokenValidity,
}
```

### EXTRA Handling the refresh token request

- Store the refresh token in the database in plain text, which is not a good idea. On a request find the user by the refresh token (the jwt guarantees uniqueness since we signed it and added the user id as the payload) and check if the token is valid.
- Store the token in the database ecnrypted, on a request decrypt the refresh token and check if the token is valid. If valid, look for the user by id (decoded from the refresh token) and generate a new access token.

- ''comment''Define a static method to find a user by its email and password.
- ''comment'' The static method will be used to authenticate a user.

```
made it work encripting the token into an object but not sure if it is the best way to do it, since is it really necessary to encrypt this type of data?
```

```javascript

```
