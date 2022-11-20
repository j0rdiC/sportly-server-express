const list = (Doc) => async (req, res) => {
  const query = await Doc.find()
  return res.json(query)
}

const getOne = (Doc) => async (req, res) => {
  const query = await Doc.findById(req.params.id)
  return res.json(query)
}

const createOne = (Doc) => async (req, res) => {
  const query = await Doc.create(req.body)
  return res.status(201).json(query)
}

const updateOne = (Doc) => async (req, res) => {
  const query = await Doc.findByIdAndUpdate(req.params.id, req.body, { new: true })
  return res.json(query)
}

const removeOne = (Doc) => async (req, res) => {
  await Doc.findByIdAndDelete(req.params.id)
  return res.status(204).send('Deleted')
}

module.exports = { list, getOne, createOne, updateOne, removeOne }
