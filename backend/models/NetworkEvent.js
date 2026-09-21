const mongoose = require("mongoose");

const networkEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      default: "Network Attack",
    },

    eventType: {
      type: String,
      default: "Network Attack",
    },

    sourceIP: {
      type: String,
      required: true,
      default: "0.0.0.0",
    },

    destinationIP: {
      type: String,
      required: true,
      default: "0.0.0.0",
    },

    protocol: {
      type: String,
      default: "TCP",
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Detected", "Investigating", "Resolved"],
      default: "Detected",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "NetworkEvent",
  networkEventSchema
);