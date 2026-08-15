import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    category: {
      type: String,
      enum: ["Billing", "Technical", "Sales", "General"],
      default: "General",
    },
    status: {
      type: String,
      enum: ["New", "In-Progress", "Resolved"],
      default: "New",
    },
    classificationSource: {
      type: String,
      enum: ["AI", "FALLBACK"],
      required: true,
    },
  },
  { timestamps: true },
);

// Compound index for fast duplicate lookup
requestSchema.index({ email: 1, createdAt: -1 });

export const Request = mongoose.model("Request", requestSchema);
