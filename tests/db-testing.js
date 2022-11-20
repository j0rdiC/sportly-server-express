const { Group } = require("../models/group")

module.exports = () => {
  const getOne = async () => {
    const group = await Group.findOne()
    console.log(group)
  }
  // getOne()

  async function updateRp() {
    const group = await Group.findOne().populate("participants", ["_id", "email"])
    group.participants[0].email = "admin@m.com"
    group.participants[0].save((error) => error && console.log(error))
    console.log(group)
  }
  //updateRp()

  async function addField() {
    const groups = await Group.find().lean()

    for (const group of groups) {
    }
  }
  // addField()
}
