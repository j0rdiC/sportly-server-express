const express = require("express")
const multer = require("multer")
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
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const crypto = require("crypto")
const sharp = require("sharp")

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
  console.log(req.file)

  const generateImgKey = (bytes = 8) =>
    crypto.randomBytes(bytes).toString("hex")

  // resize image
  const buffer = await sharp(req.file.buffer)
    .resize({ height: 1920, width: 1080, fit: "contain" })
    .toBuffer()

  const image = generateImgKey()

  const params = {
    Bucket: bucketName,
    Key: image,
    Body: buffer,
    ContentType: req.file.mimetype,
  }

  try {
    await s3.send(new PutObjectCommand(params))
    return res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.use(error)

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connection to MongoDB established"))
  .catch((err) => console.error(err))

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
)
