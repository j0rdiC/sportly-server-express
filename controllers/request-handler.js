const notFound = (res, doc) =>
  res.status(404).send({ message: `No ${doc ? doc : 'object'} found with the given ID.` })

const response = (res, query, props) => {
  if (!query) return notFound(res)
  return res.send(props ? props : query)
}

const validationErr = (res, error) => res.status(400).send({ message: error.details[0].message })

const list = (Doc) => async (req, res) => {
  const query = await Doc.find()
  return res.send(query)
}

const createOne = (Doc) => async (req, res) => {
  const query = await Doc.create(req.body)
  return res.status(201).send(query)
}

const getOne = (Doc) => async (req, res) => {
  const query = await Doc.findById(req.params.id)
  return response(res, query)
}

const updateOne = (Doc) => async (req, res) => {
  const query = await Doc.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  return response(res, query, {
    _id: query._id,
    _updatedAt: query._updatedAt,
    ...req.body,
  })
}

const deleteOne = (Doc) => async (req, res) => {
  const query = await Doc.findByIdAndDelete(req.params.id)
  if (!query) return res.status(404).send({ message: 'No object found with the given ID.' })
  return res.sendStatus(204)
}

module.exports = { notFound, response, validationErr, list, createOne, getOne, updateOne, deleteOne }
