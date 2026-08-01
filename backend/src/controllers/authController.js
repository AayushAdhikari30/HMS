import bcrypt from "bcryptjs";
import { User, Patient } from "../models/index.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../config/jwt.js";
import {
  ROLES,
  HTTP,
  JWT,
  BCRYPT_SALT_ROUNDS,
  TOKEN_TYPE,
} from "../constants.js";
import { issueToken, consumeToken } from "../services/tokenService.js";
import { getContactForUser, findUserByLoginEmail } from "../services/contactService.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "../services/authEmails.js";

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
  emailVerified: Boolean(user.email_verified_at),
});

// Every "did you forget your password" response looks identical whether or not
// the account exists — otherwise this endpoint becomes a way to enumerate which
// patients are registered at the hospital.
const GENERIC_RESET_RESPONSE = {
  success: true,
  message: "If that account exists, a reset link is on its way.",
};

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

    // Verification is best-effort: a mail outage must not cost the user their
    // new account, and they can always request a fresh link.
    try {
      const token = await issueToken({ userId: user.id, type: TOKEN_TYPE.EMAIL_VERIFY });
      await sendVerificationEmail({ to: identifier, name: fullName, token });
    } catch (mailErr) {
      console.error("[register] verification email failed", mailErr);
    }

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Account created. Check your email for a verification link.",
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

export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Identifier is required" });
    }

    const user = await findUserByLoginEmail(identifier);

    // Inactive accounts and staff with no address on file fall through to the
    // same generic reply rather than leaking why nothing arrived.
    if (user?.is_active) {
      const contact = await getContactForUser(user);
      if (contact?.email) {
        const token = await issueToken({ userId: user.id, type: TOKEN_TYPE.PASSWORD_RESET });
        await sendPasswordResetEmail({ to: contact.email, name: contact.name, token });
      } else {
        console.warn(`[forgotPassword] no email on file for user ${user.id} (${user.role})`);
      }
    }

    return res.status(HTTP.OK).json(GENERIC_RESET_RESPONSE);
  } catch (err) {
    console.error("[forgotPassword]", err);
    return res.status(HTTP.OK).json(GENERIC_RESET_RESPONSE);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Token and password are required" });
    }
    if (password.length < 8) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Password must be at least 8 characters" });
    }

    const row = await consumeToken({ token, type: TOKEN_TYPE.PASSWORD_RESET });
    if (!row) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "This reset link is invalid or has expired" });
    }

    const user = await User.findByPk(row.user_id);
    if (!user || !user.is_active) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "This reset link is invalid or has expired" });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Bumping the token version invalidates every outstanding refresh token, so
    // whoever prompted the reset is kicked out of any session they still hold.
    await user.update({
      password_hash,
      refresh_token_version: user.refresh_token_version + 1,
    });

    const contact = await getContactForUser(user);
    if (contact?.email) {
      sendPasswordChangedEmail({ to: contact.email, name: contact.name });
    }

    return res.status(HTTP.OK).json({
      success: true,
      message: "Password updated. You can now sign in.",
    });
  } catch (err) {
    console.error("[resetPassword]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Internal server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Token is required" });
    }

    const row = await consumeToken({ token, type: TOKEN_TYPE.EMAIL_VERIFY });
    if (!row) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "This verification link is invalid or has expired" });
    }

    const user = await User.findByPk(row.user_id);
    if (!user) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "This verification link is invalid or has expired" });
    }

    if (!user.email_verified_at) {
      await user.update({ email_verified_at: new Date() });
    }

    return res.status(HTTP.OK).json({ success: true, message: "Email verified" });
  } catch (err) {
    console.error("[verifyEmail]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Internal server error" });
  }
};

export const resendVerification = async (req, res) => {
  const generic = {
    success: true,
    message: "If that account needs verifying, a new link is on its way.",
  };

  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Identifier is required" });
    }

    const user = await findUserByLoginEmail(identifier);

    if (user?.is_active && !user.email_verified_at) {
      const contact = await getContactForUser(user);
      if (contact?.email) {
        const token = await issueToken({ userId: user.id, type: TOKEN_TYPE.EMAIL_VERIFY });
        await sendVerificationEmail({ to: contact.email, name: contact.name, token });
      }
    }

    return res.status(HTTP.OK).json(generic);
  } catch (err) {
    console.error("[resendVerification]", err);
    return res.status(HTTP.OK).json(generic);
  }
};