// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, // link ảnh
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ----- Thông tin profile mở rộng -----
    phone: { type: String, default: "" },
    dob: { type: Date }, // ngày sinh
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    bio: { type: String, default: "" },

    // ----- Preferences -----
    preferences: {
      language: { type: String, default: "vi" },
      subtitleLanguage: { type: String, default: "vi" },
      autoPlayNext: { type: Boolean, default: true },
      theme: { type: String, default: "dark" },
    },

    // ----- Favorites / Watchlist (để dùng sau) -----
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    watchlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],

    // ----- Reset password -----
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

// Hash password trước khi save (KHÔNG dùng next -> tránh lỗi "next is not a function")
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(this.password, salt);
  this.password = hash;
});

// so sánh password
userSchema.methods.comparePassword = async function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
