// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const {
  authMiddleware,
  adminMiddleware,
} = require("./middleware/auth.middleware");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Ví dụ route bảo vệ dùng token
app.get("/api/movies/protected", authMiddleware, (req, res) => {
  return res.json({
    message: "Bạn đã login nên xem được danh sách phim VIP 😎",
    user: req.user,
  });
});

// Ví dụ route admin
app.get("/api/admin/movies", authMiddleware, adminMiddleware, (req, res) => {
  return res.json({
    message: "Admin mới được quyền xem danh sách phim admin.",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
