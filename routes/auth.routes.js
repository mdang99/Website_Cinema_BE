const express = require("express");
const {
  signup,
  login,
  refreshToken,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

router.get("/me", authMiddleware, getMe);
router.put("/change-password", authMiddleware, changePassword);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
