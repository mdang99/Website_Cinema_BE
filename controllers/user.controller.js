// controllers/user.controller.js
const User = require("../models/User");

// GET /api/users/me
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại." });
    }
    return res.json({ user });
  } catch (error) {
    console.error("GetProfile error:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// PUT /api/users/me
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, phone, dob, gender, bio } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại." });
    }

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    if (dob !== undefined) user.dob = dob;
    if (gender !== undefined) user.gender = gender;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;

    return res.json({
      message: "Cập nhật profile thành công.",
      user: safeUser,
    });
  } catch (error) {
    console.error("UpdateProfile error:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// PUT /api/users/me/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { language, subtitleLanguage, autoPlayNext, theme } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại." });
    }

    if (language !== undefined) user.preferences.language = language;
    if (subtitleLanguage !== undefined)
      user.preferences.subtitleLanguage = subtitleLanguage;
    if (autoPlayNext !== undefined)
      user.preferences.autoPlayNext = autoPlayNext;
    if (theme !== undefined) user.preferences.theme = theme;

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;

    return res.json({
      message: "Cập nhật preferences thành công.",
      user: safeUser,
    });
  } catch (error) {
    console.error("UpdatePreferences error:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};
