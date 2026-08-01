import bcrypt from "bcryptjs";
import { User, Patient, StaffProfile } from "../models/index.js";
import { ROLES, HTTP, BCRYPT_SALT_ROUNDS } from "../constants.js";
import { getContactForUser } from "../services/contactService.js";
import { sendPasswordChangedEmail } from "../services/authEmails.js";

// Patients keep their editable details on Patient; every other role keeps
// them on StaffProfile. Every profile action needs this same lookup, so it
// lives in one place rather than being re-derived per endpoint.
const getProfileRow = async (user) => {
  if (user.role === ROLES.PATIENT) {
    return { model: Patient, row: await Patient.findOne({ where: { user_id: user.id } }) };
  }
  return { model: StaffProfile, row: await StaffProfile.findOne({ where: { user_id: user.id } }) };
};

// GET /profile — the current user's own details, regardless of role.
export const getMyProfile = async (req, res) => {
  try {
    const contact = await getContactForUser(req.user);
    if (!contact) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Profile not found" });
    }

    return res.status(HTTP.OK).json({
      success: true,
      profile: {
        name: contact.name,
        identifier: req.user.identifier,
        role: req.user.role,
        email: contact.email,
        phone: contact.phone,
      },
    });
  } catch (err) {
    console.error("[profile/get]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// PATCH /profile — currently just the phone number; the identifier (login)
// and name are intentionally not editable here.
export const updateMyProfile = async (req, res) => {
  try {
    const { phone } = req.body;

    if (phone !== undefined && !/^[0-9+\-\s()]{6,20}$/.test(phone)) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Enter a valid phone number" });
    }

    const { row } = await getProfileRow(req.user);
    if (!row) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Profile not found" });
    }

    await row.update({ phone });

    return res.status(HTTP.OK).json({ success: true, phone: row.phone });
  } catch (err) {
    console.error("[profile/update]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// PATCH /profile/password — requires the current password, unlike the
// forgot-password flow which proves identity via an emailed token instead.
export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findByPk(req.user.id);
    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      return res.status(HTTP.UNAUTHORIZED).json({ message: "Current password is incorrect" });
    }

    const password_hash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Revoking the refresh token forces re-login on every OTHER device/tab;
    // this session's still-valid access token keeps working until it expires.
    await user.update({
      password_hash,
      refresh_token_version: user.refresh_token_version + 1,
    });

    const contact = await getContactForUser(user);
    if (contact?.email) {
      sendPasswordChangedEmail({ to: contact.email, name: contact.name });
    }

    return res.status(HTTP.OK).json({ success: true, message: "Password updated" });
  } catch (err) {
    console.error("[profile/change-password]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};
