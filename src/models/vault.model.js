const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    encryptedData: {
      type: String,
      required: true,
    },
    encryptionVersion: {
      type: Number,
      default: 1,
    },
    iv: {
      type: Number,
      default: 1,
    },
    version: {
      type: Number,
      default: 1,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

vaultSchema.index({ user: 1 });
vaultSchema.index({ user: 1, version: 1 });

const Vault = mongoose.model("Vault", vaultSchema);

module.exports = Vault;
