import bcrypt from "bcryptjs";
import { User, Patient } from "../models/index.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../config/jwt.js";
import { ROLES, HTTP, JWT, BCRYPT_SALT_ROUNDS } from "../constants.js";

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict", 
  maxAge: JWT.COOKIE_MAX_AGE_MS,
};

const buildUserPayload = (user, profile = null) => ({
  id: user.id,
  role: user.role,
  identifier: user.identifier,
  name: profile?.fullname ?? user.identifier,
});

const normaliseIdentifier = (raw, role) => {
  const value = (raw || "").trim();
  return role === ROLES.PATIENT ? value.toLowerCase() : value;
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, dob, bloodGroup } = req.body;

    if (!fullName || !email || !password || !phone || !dob) {
      return res
        .status(HTTP.BAD_REQUEST)
        .json({ message: "All fields are required" });
    }
    if (password.length < 8) {
      return res
        .status(HTTP.BAD_REQUEST)
        .json({ message: "Password must be at least 8 characters" });
    }

    const identifier = normaliseIdentifier(email, ROLES.PATIENT);

    const existing = await User.findOne({ where: { identifier } });
    if (existing) {
      return res
        .status(HTTP.CONFLICT)
        .json({ message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    
    const user = await User.create({
      identifier,
      password_hash,
      role: ROLES.PATIENT,
    });

    await Patient.create({
      user_id: user.id,
      fullname: fullName,
      phone,
      dob,
      blood_group: bloodGroup || null,
    });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("[register]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Internal error" });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier: rawIdentifier, password, role } = req.body;

    if (!rawIdentifier || !password || !role) {
      return res
        .status(HTTP.BAD_REQUEST)
        .json({ message: "Identifier, password, and role are required" });
    }

    const role_ = role.toLowerCase();
    const identifier = normaliseIdentifier(rawIdentifier, role_);

    const user = await User.findOne({ where: { identifier } });

    if (!user || !user.is_active) {
      return res.status(HTTP.UNAUTHORIZED).json({ message: "Invalid credentials" });
    }
    if (user.role !== role_) {
      return res.status(HTTP.UNAUTHORIZED).json({ message: "Invalid credentials" });
    }

    // FIX: model field is `password_hash`, not `password`
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(HTTP.UNAUTHORIZED).json({ message: "Invalid credentials" });
    }

    let profile = null;
    if (user.role === ROLES.PATIENT) {
      profile = await Patient.findOne({ where: { user_id: user.id } });
    }

    const tokenPayload = {
      id: user.id,
      role: user.role,
      token_version: user.refresh_token_version,
    };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    
    res.cookie("refreshToken", refreshToken, cookieOpts);

    return res.status(HTTP.OK).json({
      success: true,
      accessToken,
      user: buildUserPayload(user, profile),
    });
  } catch (err) {
    console.error("[login]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Internal server error" });
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(HTTP.UNAUTHORIZED).json({ message: "No refresh token" });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      return res.status(HTTP.UNAUTHORIZED).json({ message: "User not found" });
    }

    if (decoded.token_version !== user.refresh_token_version) {
      return res.status(HTTP.UNAUTHORIZED).json({ message: "Token has been revoked" });
    }

    const tokenPayload = {
      id: user.id,
      role: user.role,
      token_version: user.refresh_token_version,
    };
    const newAccessToken = signAccessToken(tokenPayload);

    return res.status(HTTP.OK).json({ success: true, accessToken: newAccessToken });
  } catch {
    return res.status(HTTP.UNAUTHORIZED).json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = async (req, res) => {
  try {
    await User.increment("refresh_token_version", {
      where: { id: req.user.id },
    });

    res.clearCookie("refreshToken", cookieOpts);
    return res.status(HTTP.OK).json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("[logout]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};