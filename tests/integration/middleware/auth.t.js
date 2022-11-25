const request = require('supertest')
const mongoose = require('mongoose')
const { Group } = require('../../../models/group')
const { User } = require('../../../models/user')

let server
describe('auth middleware', () => {
  beforeEach(() => {
    server = require('../../../server')
  })
  afterEach(async () => {
    await server.close()
    await Group.remove({})
  })

  let token

  const exec = () => {
    return request(server).post('/api/groups').set('Authorization', token).send({ name: 'group1' })
  }

  beforeEach(() => {
    token = new User().generateAccessToken()
  })

  it('should return 401 if no token is provided', async () => {
    token = ''

    const res = await exec()

    expect(res.status).toBe(401)
  })

  it('should return 401 if token is invalid', async () => {
    token = 'a'

    const res = await exec()

    expect(res.status).toBe(401)
  })

  it('should return 200 if token is valid', async () => {
    const res = await exec()

    expect(res.status).toBe(200)
  })
})
