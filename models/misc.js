const mongoose = require('mongoose')

const testSchema = new mongoose.Schema({
  name: String,
  arr: [Number],
})

module.exports = mongoose.model('Misc', testSchema)
