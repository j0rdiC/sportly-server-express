const multer = require('multer')

const storage = multer.memoryStorage()
const upload = multer({ storage })

const image = upload.single('image')
const images = upload.array('images')

module.exports = { image, images }
