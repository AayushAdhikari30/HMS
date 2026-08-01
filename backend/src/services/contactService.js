import { User, Patient, StaffProfile } from "../models/index.js";
import { ROLES } from "../constants.js";

// Where a user's email and phone live depends on their role: a patient logs in
// with their email (so `identifier` is the address), while staff log in with a
// generated ID and keep their address on the staff profile. Everything that
// needs to reach a person goes through here rather than re-deriving that rule.

export const getContactForUser = async (userOrId) => {
  const user =
    typeof userOrId === "string" ? await User.findByPk(userOrId) : userOrId;

  if (!user) return null;

  if (user.role === ROLES.PATIENT) {
    const profile = await Patient.findOne({ where: { user_id: user.id } });
    return {
      userId: user.id,
      role: user.role,
      name: profile?.fullname || user.identifier,
      email: user.identifier,
      phone: profile?.phone || null,
      emailVerified: Boolean(user.email_verified_at),
    };
  }

  const profile = await StaffProfile.findOne({ where: { user_id: user.id } });
  return {
    userId: user.id,
    role: user.role,
    name: profile?.fullname || user.identifier,
    email: profile?.email || null,
    phone: profile?.phone || null,
    emailVerified: Boolean(user.email_verified_at),
  };
};

/**
 * Reverse lookup for "forgot password", where all we have is what the user
 * typed. Patients are found by email, staff by their staff ID.
 */
export const findUserByLoginEmail = async (rawIdentifier) => {
  const value = (rawIdentifier || "").trim();
  if (!value) return null;

  const patientAccount = await User.findOne({
    where: { identifier: value.toLowerCase(), role: ROLES.PATIENT },
  });
  if (patientAccount) return patientAccount;

  const staffAccount = await User.findOne({ where: { identifier: value } });
  if (staffAccount) return staffAccount;

  // Staff may type their email address instead of their staff ID.
  const staffProfile = await StaffProfile.findOne({
    where: { email: value.toLowerCase() },
  });
  return staffProfile ? User.findByPk(staffProfile.user_id) : null;
};
