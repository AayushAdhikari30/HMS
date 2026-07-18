import bcrypt from "bcryptjs";
import { User, StaffProfile } from "../models/index.js";
import { generateStaffIdentifier, generateTempPassword } from "../utils/staffId.js";
import {
  ROLES,
  STAFF_ROLES,
  HTTP,
  BCRYPT_SALT_ROUNDS,
  TOKEN_TYPE,
} from "../constants.js";
import { issueToken } from "../services/tokenService.js";
import { sendStaffWelcomeEmail } from "../services/authEmails.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createStaff = async (req, res) => {
  try {
    const { fullName, role, email, phone, department, specialization } = req.body;

    if (!fullName || !role) {
      return res
        .status(HTTP.BAD_REQUEST)
        .json({ message: "fullName and role are required" });
    }

    const normalisedEmail = email ? String(email).trim().toLowerCase() : null;
    if (normalisedEmail && !EMAIL_RE.test(normalisedEmail)) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "email is not a valid address" });
    }
    if (normalisedEmail) {
      const taken = await StaffProfile.findOne({ where: { email: normalisedEmail } });
      if (taken) {
        return res.status(HTTP.CONFLICT).json({ message: "That email is already on a staff profile" });
      }
    }

    const normalizedRole = role.toLowerCase();
    if (!STAFF_ROLES.includes(normalizedRole)) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: `role must be one of: ${STAFF_ROLES.join(", ")}`,
      });
    }

    const identifier = await generateStaffIdentifier(normalizedRole);
    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, BCRYPT_SALT_ROUNDS);

    const user = await User.create({
      identifier,
      password_hash,
      role: normalizedRole,
    });

    await StaffProfile.create({
      user_id: user.id,
      fullname: fullName,
      email: normalisedEmail,
      phone: phone || null,
      department: department || null,
      specialization: normalizedRole === ROLES.DOCTOR ? specialization || null : null,
    });

    // Best-effort welcome: the admin still gets the temp password on screen, so
    // a mail failure only costs the staff member the self-serve setup link.
    let welcomeEmailed = false;
    if (normalisedEmail) {
      try {
        const token = await issueToken({ userId: user.id, type: TOKEN_TYPE.PASSWORD_RESET });
        const result = await sendStaffWelcomeEmail({
          to: normalisedEmail,
          name: fullName,
          identifier,
          role: normalizedRole,
          token,
        });
        welcomeEmailed = result.delivered;
      } catch (mailErr) {
        console.error("[staff/create] welcome email failed", mailErr);
      }
    }

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Staff account created",
      staff: {
        id: user.id,
        identifier: user.identifier,
        role: user.role,
        name: fullName,
        email: normalisedEmail,
      },
      welcomeEmailed,
      tempPassword,
    });
  } catch (err) {
    console.error("[staff/create]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const listStaff = async (req, res) => {
  try {
    const { role } = req.query;
    const where = role
      ? { role: role.toLowerCase() }
      : { role: STAFF_ROLES };

    const staff = await User.findAll({
      where,
      attributes: { exclude: ["password_hash"] },
      include: [{ model: StaffProfile, as: "staffProfile", required: false }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(HTTP.OK).json({
      success: true,
      staff: staff.map((u) => ({
        id: u.id,
        identifier: u.identifier,
        role: u.role,
        is_active: u.is_active,
        name: u.staffProfile?.fullname ?? u.identifier,
        email: u.staffProfile?.email ?? null,
        phone: u.staffProfile?.phone ?? null,
        department: u.staffProfile?.department ?? null,
        specialization: u.staffProfile?.specialization ?? null,
      })),
    });
  } catch (err) {
    console.error("[staff/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};
