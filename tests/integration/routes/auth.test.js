const request = require('supertest')
const { User } = require('../../../models/user')

require('dotenv').config()

// test the auth route
// open and close the server before and after each test
describe('/api/auth', () => {
  let server
  beforeEach(() => {
    server = require('../../../server')
  })
  afterEach(async () => {
    await server.close()
    await User.deleteMany({})
  })

  // test the auth register route
  // it should return 400 if email or password are invalid
  // it should return 400 if user already exists
  // it should return 201 if user is created
  let email
  let password

  describe('POST /register', () => {
    beforeEach(() => {
      email = 'jordi@mail.com'
      password = '123456'
    })

    const exec = () => request(server).post('/api/auth/register').send({ email, password })

    it('should create the user if the email and password are valid', async () => {
      await exec()

      const user = await User.findOne({ email })
      expect(user).not.toBeNull()
    })

    it('should return the user id and email if valid email and password are given', async () => {
      const res = await exec()

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('_id')
      expect(res.body).toHaveProperty('email', email)
    })

    it('should return 400 if email is invalid', async () => {
      email = 'jordi'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if password is invalid', async () => {
      password = '1234'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 and a declarative message if user already exists', async () => {
      const user = new User({ email, password })
      await user.save()

      const res = await exec()

      console.log(res.body)

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('message', 'User already registered.')
    })
  })

  // test the auth login route
  // it should return 400 if email or password are invalid
  // it should return 400 if user does not exist
  // it should return 400 if password is invalid
  // it should return 200 if user is logged in

  describe('POST /', () => {
    beforeEach(() => {
      email = 'jordi@mail.com'
      password = '123456'
    })

    const exec = () => request(server).post('/api/auth').send({ email, password })

    it('should return 400 if email is invalid', async () => {
      email = 'jordi'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if password is invalid', async () => {
      password = '1234'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if user does not exist', async () => {
      const res = await exec()

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('message', 'Invalid email or password.')
    })

    it('should return 400 if passwords do not match', async () => {
      const user = new User({ email, password: '1234567' })
      await user.save()

      const res = await exec()

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('message', 'Invalid email or password.')
    })

    it('should return 200 and tokens if email and password are valid', async () => {
      const user = new User({ email: 'jo@m.com', password: '12345' })
      await user.save()

      const res = await request(server).post('/api/auth').send({ email: 'j0@m.com', password: '12345' })

      console.log(user)

      console.log(email, password)

      console.log(res.body)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('access')
      expect(res.body).toHaveProperty('refresh')
    })
  })

  // test the auth refresh route
  // it should return 401 if no user is logged in
  // it should return 403 if refresh token is invalid
  // it should return 200 if refresh token is valid

  describe('POST /refresh', () => {
    let access
    beforeEach(() => {
      access = new User().generateAccessToken()
    })

    it('should return 403 refresh token is invalid', async () => {
      const refreshToken = new User().generateRefreshToken()
      const user = new User({ email, password, refreshToken })
      await user.save()

      const res = await request(server)
        .post('/api/auth/refresh')
        .set('Authorization', access)
        .send({ refresh: 'x' })

      expect(res.status).toBe(403)
    })

    // it('should return 403 if refresh token is invalid', async () => {
    //   refresh = '1234'

    //   const res = await exec()

    //   console.log(res.body)
    //   expect(res.status).toBe(403)
    // })

    it('should return 200 and a new access token if refresh token is valid', async () => {
      const refreshToken = new User().generateRefreshToken()
      const user = new User({ email, password, refreshToken })
      await user.save()

      const res = await request(server)
        .post('/api/auth/refresh')
        .set('Authorization', access)
        .send({ refresh: refreshToken })

      console.log(res.body)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('access')
    })
  })
})
