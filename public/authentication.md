# JWT authentication management with access and refresh tokens. Server and client side.

## **Index**

1. [**Server side.**](#1-server-side) (express, mongoDB, mongoose).
   1. [Defining the user model.](#11-defining-the-user-model)
   2. [Registering the user.](#12-registering-the-user)
   3. [Authenticating the user.](#13-authenticating-the-user-login)
   4. [Refreshing the access token.](#14-refreshing-the-access-token)
   5. [Authentication end points.](#15-authentication-router)
   6. [Protecting end points.](#16-protecting-end-points)
   7. [Accessing protected end points.](#17-accessing-protected-end-points)
   8. [Deleting expired refresh tokens.](#18-deleting-expired-refresh-tokens)
2. [**Client side.**](#2-client-side) (expo, axios, expo-secure-store).
   1. [Axios interceptor.](#21-axios-interceptor)
   2. [Storing the tokens.](#22-local-storage-with-expo-secure-store)
   3. [App entry point.](#23-app-entry-point)
   4. [Managing the authentication state.](#24-managing-the-authentication-state)
   5. [Custom useApi hook.](#25-custom-useapi-hook)

---

## **1. Server side.**

### **1.1 Defining the user model.**

- Define the **user schema** which will include the generate access and refresh token methods.
- The [mongoose Schema class](https://mongoosejs.com/docs/guide.html) takes an options object as its second argument where we can define this [methods](https://www.mongoosejs.cn/docs/guide.html#methods).
- The **generateAcessToken** method will generate a JWT with the user id and the user role as the payload.
- The **generateRefreshToken** method will generate a JWT with the user id as the payload and save the token in the database.
- Define a **validation schema** for the user registration with the Joi library.
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

### **1.2 Registering the user**

- Validate the user input.
- Check if the user already exists.
- Create a new user with a hashed password.

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

- The main purpose of validating the input with Joi, even tho the mongoose model has validation itself, is so that we don't reach the database if the input is invalid.
- It also allows us to send a more specific error message to the client.

```js
const validationErr = (res, error) => res.status(400).send({ message: error.details[0].message })
```

---

### **1.3 Authenticating the user**. (login)

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

### **1.4 Refreshing the access token.**

- Validate the refresh token.
- If the refresh token is invalid / expired the client should login again.
- Decode the refresh token to get the user id.
- Check if the user exists.
- Generate new access and refresh tokens (remember the refresh token will be saved in the database).
- Since this is for a mobile app only **one device** will be used to login, so we can **overwrite the refresh token** in the database.
- By doing this we invalidate the previous refresh token. This is a good practice to avoid security issues. Also known as **blacklisting**.
- Again if we wanted to access the server from multiple devices we would change the implementation.

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

---

### **1.5 Authentication router.**

- Auth endpoints (login, register, refresh).

```js
const router = require('express').Router()
const { loginUser, registerUser, refreshUser } = require('../controllers/auth-control')

router.post('/', loginUser)
router.post('/register', registerUser)
router.post('/refresh', refreshUser)

module.exports = router
```

---

### **1.6 Protecting end points.**

- Create a middleware function to check if the user is authenticated.
- Send 401 "unauthorized" if the user is not authenticated. This number is important because it will be used in the client with axios interceptors.
- If the user is authenticated we decode the token and add the payload to the request object.
- Remember that the payload contains the user id and role.

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
- It must be used **after** the authentication middleware. In order to acces the updated request object.
- Send 403 "forbidden" if the user is not an admin.

```js
module.exports = (req, res, next) => {
  if (!req.user.isAdmin) return res.status(403).send({ message: 'Access denied.' })

  next()
}
```

---

### **1.7 Accessing protected end points.**

- A nice end point to interact with the current logged in user ".../api/users/me".
- You can imagine how the other http methods are implemented.
- Note that we are using the user id from the request object. This is possible because we decoded the token in the authentication middleware.
- Also note when listing the users and using the admin middleware it is placed after the authentication middleware in the array.

<!-- prettier-ignore -->
```js
// Controller
const getUser = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password')
  res.send(user)
}

// Router
const router = require('express').Router()
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

router.get('/', [auth, admin], listUsers)

router.route('/me')
  .get(auth, getUser)
  .put([auth, image], updateUser)
  .delete(auth, deleteUser)

// Startup
app.use('/api/auth', require('../routes/auth'))
app.use('/api/users', require('../routes/users'))
```

---

### **1.8 Deleting expired refresh tokens.**

- In order to clear the database from expired refresh tokens we can use a cron job.
- This can be a good idea for future queries and security reasons.
- Note that [async callbacks in forEach loops](https://www.geeksforgeeks.org/difference-between-foreach-and-for-loop-in-javascript/) may cause unexpected results (javascript...).
- Use a for loop instead.

```js
const deleteExpiredRefreshTokens = async () => {
  const users = await User.find({ refreshToken: { $exists: true } })

  for (let user of users) {
    jwt.verify(user.refreshToken, config.get('jwtRKey'), async (err, decoded) => {
      if (err) await user.deleteOne({ refreshToken })
    })
  }
}
```

---

### **1.9. Comments.**

- I looked at two different approaches:

  1. Creating a new mongo db collection for refresh tokens:

     - Creating a model with the user id and the refresh token itself.
     - Using mongo db TTL (time to live) to delete the refresh token document after a certain time.
     - May be a good idea if we want to access the server from multiple devices.
     - Better for scalability. (I think)
     - Bad for performance since we have to double the number of queries.

  2. Saving the refresh token in the user document:

     - This is the approach I used.
     - Since it is for a mobile app only one
     - Better for performance since we only have to make one query.
     - I think the second approach is better for this project.

---

## **2. Client side.**

### **2.1 Axios interceptor.**

- To call the server and handle protected routes I used [axios interceptors](https://axios-http.com/docs/interceptors).
- They allow you to intercept requests and responses before they are handled by then or catch.
- If in the first request the response is 401, the interceptor will try to refresh the access token.
- If the refresh token is invalid, the user will be redirected to the login screen.
- I also like to use [api-sauce](https://github.com/infinitered/apisauce) as a wrapper for axios. It makes the code cleaner by giving you an 'ok' boolean value in the response object which will be true if the status code lays between 200 and 299. Avoiding the need for the typical "if status !== 200" or try catch blocks.

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
    if (!access) return // TODO: logout

    config.headers['Authorization'] = access

    return config
  },
  (error) => Promise.reject(error)
)

baseClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const valid = await authStorage.getRefreshTokenValidity()
    if (!valid) return // TODO: logout

    const prevRequest = error.config

    if (error.response.status === 401 && !prevRequest.sent) {
      prevRequest.sent = true

      const newAccessToken = await updateAccessToken()
      if (!newAccessToken) return // TODO: logout

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

- This is what it would look like in the server.

```
GET /api/users/me 401 0.573 ms
POST /api/auth/refresh 200 136.147 ms
GET /api/users/me 200 81.137 ms
```

---

### **2.2 Local storage with expo secure store.**

- I used expo-secure-store to store the tokens in the mobile app.
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
    console.log('Error storing the auth tokens', error)
  }
}

const getTokens = async () => {
  try {
    return JSON.parse(await SecureStore.getItemAsync(key))
  } catch (error) {
    console.log('Error getting the auth tokens', error)
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
    console.log('Error removing the auth tokens', error)
  }
}

const validateToken = (token) => {
  try {
    const decoded = jwtDecode(token)
    return decoded.exp > Date.now() / 1000
  } catch (error) {
    console.log('Error validating the tokens', error)
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

---

### **2.3 App entry point.**

- The app entry point is where the authentication flow starts.
- I am using **react context to manage the authentication state** and pass the user info around the app.
- First check if the user is logged in (has tokens in storage) and if the refresh token has expired.
- If everything is **ok**, the **app navigator** will be rendered.
- If **not**, the **authentication navigator** will be rendered.
- Remember the getUser function returns the decoded access token with the user info.

```javascript
export default App = () => {
  const [user, setUser] = useState()

  const restoreUser = async () => {
    const user = await authStorage.getUser()
    if (user) setUser(user)
  }

  useEffect(() => {
    restoreUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <AppContainer>
        {user ? <AppNavigator /> : <AuthNavigator />}
        <StatusBar style={useColorModeValue('dark', 'light')} />
      </AppContainer>
    </AuthContext.Provider>
```

---

### **2.4 Managing the authentication state.**

- I created a custom hook to manage the authentication state of the app.
- It is used to **login** or **logout** the user from anywhere in the app.
- The **logIn** function will store the tokens in the local storage and set the user in the context.
- The **logOut** function will remove the tokens from the local storage and remove the user from the context.
- Hence **redirecting the user** to the auth navigator (login and register screens).

```javascript
export default useAuth = () => {
  const { user, setUser } = useContext(AuthContext)

  const logIn = (tokens) => {
    const userInfo = jwtDecode(tokens.access)
    setUser(userInfo)
    authStorage.storeTokens(tokens)
  }

  const logOut = () => {
    setUser(null)
    authStorage.removeTokens()
  }

  return { user, logIn, logOut }
}
```

- **Example of use** in the login screen.
- If the response is **successful**, the **logIn** function is called with the tokens as an argument.

```javascript
import authApi from '../../api/auth'
import useAuth from '../../auth/useAuth'

export default LoginScreen = ({ navigation }) => {
  const auth = useAuth()
  const loginApi = useApi(authApi.login)

  const handleSubmit = async ({ email, password }) => {
    const res = await loginApi.request(email, password)

    if (!res.ok)
      return res.status
        ? loginApi.setError(res.data.message)
        : loginApi.setError('An unexpected error ocurred.')

    auth.logIn(res.data)
  }
```

- Here is the login api function.

```javascript
const login = (email, password) => openClient.post('/auth', { email, password })
```

---

### **2.5 Custom useApi hook.**

- The useApi hook comes very handy whenever you want to call apis and save the data in the state of a component.
- I used it in the example above even though I am not saving data in the state. I just want my app to have the same structure all over.
- In my opinion, components should not handle the logic of making api calls.
- It may be a bit confusing at first but I really like to have a separation of concerns.
- It is also easier to debug in the future.

```javascript
export default useApi = (apiFunction) => {
  const [data, setData] = useState()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const request = async (...args) => {
    setLoading(true)
    const response = await apiFunction(...args)
    setLoading(false)

    setError(!response.ok)
    setData(response.data)

    return response
  }

  return { data, error, setError, loading, request }
}
```

- **Example of use**.
- As you can see there is **no need** to create **states** for data, loading, etc. Or even an async **function** to make the **api call**!

```javascript
export default AccountScreen = () => {
  const { data: user, request, loading } = useApi(usersApi.getUser)

  useEffect(() => {
    request()
  }, [])

  return <Text>Hello {user.firstName}!</Text>

```

- Here is the getUser function.
- This is a protected route in my server as mentioned before.
- So I am using the axios interceptor instance created in section [2.1](#21-axios-interceptor).

```javascript
const getUser = () => privateClient.get('/users/me')
```
