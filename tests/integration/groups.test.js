const request = require('supertest')
const mongoose = require('mongoose')
const { Group } = require('../../models/group')
let server

describe('/api/groups', () => {
  beforeEach(() => {
    server = require('../../server')
  })
  afterEach(async () => {
    await server.close()
    await Group.deleteMany({})
  })

  describe('GET /', () => {
    it('should return all groups and append the imageName if they have it', async () => {
      const groups = [{ name: 'group1', imageName: 'x1' }, { name: 'group2' }]
      await Group.collection.insertMany(groups)

      const res = await request(server).get('/api/groups')

      expect(res.status).toBe(200)
      expect(res.body.length).toBe(2)
      expect(res.body.some((g) => g.name === 'group1')).toBeTruthy()
      expect(res.body.some((g) => g.name === 'group2')).toBeTruthy()
    })
  })

  describe('GET /:id', () => {
    it('should return a group if valid id is given', async () => {
      const group = Group({ name: 'group1' })
      await group.save()

      const res = await request(server).get(`/api/groups/${group._id}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('name', group.name)
    })

    it('should return 404 if invalid id is passed', async () => {
      const res = await request(server).get('/api/groups/1')

      console.log(res.status, res.body)
      expect(res.status).toBe(404)
    })

    it('should return 404 if no group with the given id exists', async () => {
      const id = mongoose.Types.ObjectId()
      const res = await request(server).get(`/api/groups/${id}`)

      console.log(res.status, res.body)
      expect(res.status).toBe(404)
    })
  })
})
