const mongoose = require("mongoose");

const securityAlertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      default: "Network Attack",
    },

    sourceIP: {
      type: String,
      required: true,
    },

    destinationIP: {
      type: String,
      required: true,
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
      enum: ["Active", "Resolved"],
      default: "Active",
    },

    confidence: {
      type: Number,
      default: 0,
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SecurityAlert",
  securityAlertSchema
);