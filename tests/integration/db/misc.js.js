const request = require('supertest')

const Misc = require('../../../models/misc')

let server

// describe('/api/groups', () => {

//   describe('GET /', () => {
//     it('should return all groups', async () => {
//       const res = await request(server).get('/api/groups')
//       expect(res.status).toBe(200)
//     })
//   })
// })

describe('Misc collection', () => {
  beforeEach(() => {
    server = require('../../../server')
  })
  afterEach(async () => {
    await Misc.deleteMany({})
    await server.close()
  })

  describe('LIST, CREATE', () => {
    it('should create a misc doc', async () => {
      let newMiscs = [{ name: 'Pepe' }, { name: 'Juan' }]

      const miscs = await Misc.collection.insertMany(newMiscs)
      // const miscs = await Misc.collection.insertMany([{ name: 'Pepe' }, { name: 'Juan' }])
      // console.log(miscs)
    })
  })
})
