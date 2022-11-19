const notFound = (res) =>
  res.status(404).json({ message: "The given ID was not found." })

exports.list = async (req, res, Doc) => {
  const query = await Doc.find()
  return res.json(query)
}

exports.detail = async (req, res, Doc) => {
  const query = await Doc.findById(req.params.id)
  return res.json(query)
}

exports.create = async (req, res, Doc) => {
  const query = await Doc.create(req.body)
  return res.status(201).json(query)
}

exports.update = async (req, res, Doc) => {
  const query = await Doc.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  })
  return res.json(query)
}

exports.delete = async (req, res, Doc) => {
  await Doc.findByIdAndDelete(req.params.id)
  return res.status(204).send("Deleted")
}
