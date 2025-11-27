// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");

// bảo vệ route
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer xxx

  if (!token) {
    return res
      .status(401)
      .json({ message: "Không có token. Vui lòng đăng nhập." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { id, email, name, role }
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

// middleware check admin (dùng cho API quản lý phim)
const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới được truy cập." });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
