import bcrypt from "bcryptjs";
import { User, StaffProfile } from "../models/index.js";
import { generateStaffIdentifier, generateTempPassword } from "../utils/staffId.js";
import { ROLES, STAFF_ROLES, HTTP, BCRYPT_SALT_ROUNDS } from "../constants.js";


export const createStaff = async (req, res) => {
  try {
    const { fullName, role, phone, department, specialization } = req.body;

    if (!fullName || !role) {
      return res
        .status(HTTP.BAD_REQUEST)
        .json({ message: "fullName and role are required" });
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
      phone: phone || null,
      department: department || null,
      specialization: normalizedRole === ROLES.DOCTOR ? specialization || null : null,
    });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Staff account created",
      staff: {
        id: user.id,
        identifier: user.identifier,
        role: user.role,
        name: fullName,
      },
      
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
