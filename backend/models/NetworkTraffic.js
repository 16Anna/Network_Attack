const mongoose = require("mongoose");

const networkTrafficSchema = new mongoose.Schema(
  {
    sourceIP: {
      type: String,
      required: true,
    },

    destinationIP: {
      type: String,
      required: true,
    },

    protocol: {
      type: String,
      required: true,
    },

    sourcePort: {
      type: Number,
      default: 0,
    },

    destinationPort: {
      type: Number,
      default: 0,
    },

    packetCount: {
      type: Number,
      default: 0,
    },

    bytes: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number,
      default: 0,
    },

    flowRate: {
      type: Number,
      default: 0,
    },

    label: {
      type: String,
      default: "BENIGN",
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
  "NetworkTraffic",
  networkTrafficSchema
);