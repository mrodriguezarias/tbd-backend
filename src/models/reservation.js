import mongoose from "mongoose"
import dbUtils from "../utils/db"

const reservationSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
  },
  {
    toJSON: dbUtils.toJSON(),
  },
)

const reservationModel = mongoose.model("Reservation", reservationSchema)

export default reservationModel
