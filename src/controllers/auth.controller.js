const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/user.model");

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { email, password, masterKeyVerifier, salt } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exisits" });
    }

    const newUser = new User({ email, password, masterKeyVerifier, salt });
    await newUser.save();

    const { accessToken, refreshToken } = generateTokens(newUser._id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    newUser.refreshTokens.push({ token: refreshToken, expiresAt });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate Account
    const user = await User.findOne(email);
    if (!user) {
      return res.status(401).json({ message: "Account does not exist" });
    }

    // Validate Password
    const isPasswordValid = await user.isValidPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credentials are invalid" });
    }

    const { accessToken, refreshToken } = generateToken(user._id);

    const expiresAt = newDate();
    expiresAt.setDate(expiresAt.getDate() + 7);

    user.refreshToken.push({ token: refreshToken, expiresAt });

    user.refreshTokens = user.refreshToken.filter(
      (token) => token.expiresAt > new Date()
    );

    user.lastActive = new Date();
    await user.save();

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        emai: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        salt: user.salt,
        masterKeyVerifier: user.masterKeyVerifier,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Refresh token invalid" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const tokenExists = user.refreshTokens.some(
      (token) => token.token === refreshToken && token.expiresAt > new Date()
    );

    if (!tokenExists) {
      return res
        .status(401)
        .json({ message: "Refresh token expired or invalid" });
    }

    const newTokens = generateTokens(user._id);

    user.refreshTokens = user.refreshTokens.filter(
      (token) => token.token !== refreshToken
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDates() + 7);

    user.refreshTokens.push({
      token: newTokens,
      expiresAt,
    });

    user.lastActive = new Date();
    await user.save();

    res.status(200).json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ mesage: "Error refreshing token" });
  }
};
