const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const groupSchema = new mongoose.Schema(
  {
    name: String,
    location: String,
    level: { type: String, enum: ["begginer", "amateur", "pro"] },
    type: { type: String, enum: ["frienldy", "competitive"] },
    isPrivate: { type: Boolean, default: false },
    admin: { type: ObjectId, ref: "User" },
    participants: [{ type: ObjectId, ref: "User" }],

    image: String,
  },

  {
    timestamps: {
      createdAt: "_createdAt",
      updatedAt: "_updatedAt",
    },
  }
)

exports.Group = mongoose.model("Group", groupSchema)
