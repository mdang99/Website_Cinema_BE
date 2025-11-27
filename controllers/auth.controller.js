// controllers/auth.controller.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// ========== HÀM TẠO TOKEN ==========

const generateTokens = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });

  return { accessToken, refreshToken };
};

// ========== SIGNUP ==========
// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { email, password, name, avatar } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, name là bắt buộc." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Email đã tồn tại. Vui lòng dùng email khác." });
    }

    const user = new User({ email, password, name, avatar });
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);

    return res.status(201).json({
      message: "Đăng ký thành công.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// ========== LOGIN ==========
// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email và password là bắt buộc." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    return res.json({
      message: "Đăng nhập thành công.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// ========== REFRESH TOKEN ==========
// POST /api/auth/refresh-token
exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token là bắt buộc." });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const payload = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
    });

    return res.json({
      message: "Refresh token thành công.",
      accessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res
      .status(403)
      .json({ message: "Refresh token không hợp lệ hoặc đã hết hạn." });
  }
};

// ========== GET ME (dùng token) ==========
// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại." });
    }
    return res.json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// ========== CHANGE PASSWORD ==========
// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "oldPassword và newPassword là bắt buộc." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải ít nhất 6 ký tự." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại." });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng." });
    }

    user.password = newPassword; // sẽ hash bởi pre('save')
    await user.save();

    return res.json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("ChangePassword error:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// ========== FORGOT PASSWORD (GỬI MAIL) ==========
// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email là bắt buộc." });

    const user = await User.findOne({ email });
    if (!user) {
      // Không tiết lộ email có/không
      return res.json({
        message:
          "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn reset mật khẩu.",
      });
    }

    // 1. Tạo token random
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Hash token và lưu vào DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
    await user.save();

    // 3. Tạo link reset cho FE
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    // 4. Gửi email
    const subject = "Đặt lại mật khẩu - Movie Cinema";
    const text = `Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu cho tài khoản trên website xem phim.\n\nVui lòng truy cập link sau để đặt lại mật khẩu (link có hiệu lực 15 phút):\n${resetUrl}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`;

    const html = `
      <p>Chào ${user.name || "bạn"},</p>
      <p>Bạn vừa yêu cầu <b>đặt lại mật khẩu</b> cho tài khoản trên website xem phim.</p>
      <p>Vui lòng nhấn vào nút dưới đây trong vòng <b>15 phút</b> để đặt lại mật khẩu:</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#e50914;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">
          Đặt lại mật khẩu
        </a>
      </p>
      <p>Hoặc copy link sau và dán vào trình duyệt:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <hr />
      <p>Nếu bạn không yêu cầu, bạn có thể bỏ qua email này.</p>
      <p>Movie Cinema Team</p>
    `;

    await sendEmail({ to: user.email, subject, text, html });

    return res.json({
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn reset mật khẩu.",
    });
  } catch (error) {
    console.error("ForgotPassword error:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// ========== RESET PASSWORD ==========
// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "token và newPassword là bắt buộc." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải ít nhất 6 ký tự." });
    }

    // Hash token client gửi lên
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }, // còn hạn
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
    }

    user.password = newPassword; // sẽ hash bởi pre('save')
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Đặt lại mật khẩu thành công." });
  } catch (error) {
    console.error("ResetPassword error:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};
