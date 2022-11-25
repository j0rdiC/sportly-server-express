const request = require('supertest')
const mongoose = require('mongoose')
const { Group } = require('../../../models/group')
const { User } = require('../../../models/user')

describe('/api/groups', () => {
  let server
  beforeEach(() => {
    server = require('../../../server')
  })
  afterEach(async () => {
    await server.close()
    await Group.deleteMany({})
  })

  describe('GET /', () => {
    it('should return all groups and append the imageUrl if they have an image', async () => {
      const groups = [
        {
          name: 'group1',
          imageName: 'img1',
        },
        { name: 'group2' },
      ]
      await Group.collection.insertMany(groups)

      const res = await request(server).get('/api/groups')

      expect(res.status).toBe(200)
      expect(res.body.length).toBe(2)
      expect(res.body.some((g) => g.name === 'group1')).toBeTruthy()
      expect(res.body.some((g) => g.name === 'group2')).toBeTruthy()
      expect(res.body[0].imageName).toBeTruthy()
    })
  })

  describe('GET /:id', () => {
    it('should return a group if valid id is given', async () => {
      const group = new Group({ name: 'group1' })
      await group.save()

      const res = await request(server).get(`/api/groups/${group._id}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('name', group.name)
    })

    it('should return 404 if invalid id is given', async () => {
      const res = await request(server).get('/api/groups/1')

      expect(res.status).toBe(404)
    })

    it('should return 404 if no group with the given id exists', async () => {
      const id = mongoose.Types.ObjectId()
      const res = await request(server).get(`/api/groups/${id}`)

      expect(res.status).toBe(404)
    })
  })

  describe('POST /', () => {
    // Define the happy path, and then in each test, we change
    // one parameter that clearly aligns with the name of the test.
    let token
    let name
    let type

    const exec = () => request(server).post('/api/groups').set('Authorization', token).send({ name, type })

    beforeEach(() => {
      token = new User().generateAccessToken()
      name = 'group1'
      type = 'friendly'
    })

    it('should return 401 if client is not logged in', async () => {
      token = ''

      const res = await exec()

      expect(res.status).toBe(401)
    })

    it('should return 400 if no name is provided', async () => {
      name = ''

      const res = await exec()

      expect(res.status).toBe(400)
    })

    it('should return 400 if type is not [friendly, competitive]', async () => {
      type = 'type1'

      const res = await exec()

      expect(res.status).toBe(400)
    })

    // happy path
    it('should save the group if it is valid', async () => {
      await exec()

      const group = await Group.findOne({ name: 'group1' })

      expect(group).not.toBeNull()
    })

    it('should return the group if it is valid', async () => {
      const res = await exec()

      console.log(res.body)

      expect(res.body).toHaveProperty('_id')
      expect(res.body).toHaveProperty('name', 'group1')
    })
  })
})
