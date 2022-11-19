const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const mongoose = require("mongoose")
const helmet = require("helmet")
const winston = require("winston")
require("express-async-errors")
require("dotenv").config()

const error = require("./utils/error")
const users = require("./routes/users")
const auth = require("./routes/auth")
const groups = require("./routes/groups")

const app = express()
const port = process.env.PORT || 8000

process.on("uncaughtException", (ex) => {
  winston.error(ex.message, ex)
  // process.exit(1)
})

process.on("unhandledRejection", (ex) => {
  winston.error(ex.message, ex)
  // process.exit(1)
})

winston.add(new winston.transports.File({ filename: "logfile.log" }))

if (!process.env.JWT_KEY) {
  console.error("FATAL ERROR: jwt-private-key is not defined.")
  process.exit(1)
}

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))
app.use(helmet())

app.get("env").includes("dev") && app.use(morgan("dev"))

// Routes
app.get("/", (req, res) => res.send("Hello"))

app.use("/auth", auth)
app.use("/api/users", users)
app.use("/api/groups", groups)

// S3 Bucket
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const multer = require("multer")
const crypto = require("crypto")
const sharp = require("sharp")
const { Group } = require("./models/group")

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

const storage = multer.memoryStorage()
const upload = multer({ storage })

app.put("/api/groups/:id/image", upload.single("image"), async (req, res) => {
  console.log(`1 - Upload group image req: ${req.body.name}`)

  const generateImgName = (bytes = 16) =>
    crypto.randomBytes(bytes).toString("hex")

  // resize image
  const buffer = await sharp(req.file.buffer)
    .resize({ height: 1920, width: 1080, fit: "contain" })
    .toBuffer()

  const imageName = req.body.name + generateImgName()

  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  }

  console.log("2 - Calling S3")
  await s3.send(new PutObjectCommand(params))
  console.log("3 - S3 done, calling DB")
  const group = await Group.create({ ...req.body, imageName })
  console.log("4 - DB done, sending res...")
  return res.json(group)
})

app.get("/api/groups/aws", async (req, res) => {
  const groups = await Group.find().lean() //.populate("participants", ["_id", "email"])

  for (const group of groups) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: group.imageName,
    }
    const command = new GetObjectCommand(getObjectParams)
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
    group.imageUrl = url
  }

  return res.json(groups)
})

app.use(error)

// DB Testing

// update relationship
async function updateRp() {
  const group = await Group.findOne().populate("participants", ["_id", "email"])
  group.participants[0].email = "admin@m.com"
  group.participants[0].save((error) => error && console.log(error))
  console.log(group)
}

//updateRp()

// add fiels in response
async function addField() {
  const groups = await Group.find().lean()

  // groups.forEach(async (group) => {
  //   const getObjectParams = {
  //     Bucket: bucketName,
  //     Key: group.imageName,
  //   }
  //   const command = new GetObjectCommand(getObjectParams)
  //   // getSignedUrl(s3, command, { expiresIn: 3600 }).then((url) => {
  //   //   console.log(url)
  //   // })
  //   const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

  //   group.url = url
  //   console.log(group)
  // })

  for (const group of groups) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: group.imageName,
    }
    const command = new GetObjectCommand(getObjectParams)
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
    group.url = url
  }

  console.log(groups)
}

// addField()

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connection to MongoDB established"))
  .catch((err) => console.error(err))

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
)
