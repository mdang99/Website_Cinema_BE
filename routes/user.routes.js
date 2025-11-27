// routes/user.routes.js
const express = require("express");
const {
  getProfile,
  updateProfile,
  updatePreferences,
} = require("../controllers/user.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

// MỤC 2: profile & preferences
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);
router.put("/me/preferences", authMiddleware, updatePreferences);

module.exports = router;
