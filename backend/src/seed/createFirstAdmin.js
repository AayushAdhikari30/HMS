import "dotenv/config";
import bcrypt from "bcryptjs";
import sequelize from "../db/connection.js";
import { User, StaffProfile } from "../models/index.js";
import { generateStaffIdentifier, generateTempPassword } from "../utils/staffId.js";
import { ROLES, BCRYPT_SALT_ROUNDS } from "../constants.js";

// One-time bootstrap: creates the very first admin account so someone can log
// in and use "Add Staff" for everyone else from then on. Safe to re-run — it
// does nothing if an admin already exists.
const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.NODE_ENV === "development" });

  const existingAdmin = await User.findOne({ where: { role: ROLES.ADMIN } });
  if (existingAdmin) {
    console.log(`\nAn admin account already exists: ${existingAdmin.identifier}`);
    console.log("Nothing to do — use that account, or reset its password if it's lost.\n");
    process.exit(0);
  }

  const identifier = await generateStaffIdentifier(ROLES.ADMIN);
  const tempPassword = generateTempPassword();
  const password_hash = await bcrypt.hash(tempPassword, BCRYPT_SALT_ROUNDS);

  const user = await User.create({
    identifier,
    password_hash,
    role: ROLES.ADMIN,
  });

  await StaffProfile.create({
    user_id: user.id,
    fullname: "System Administrator",
  });

  console.log(`\n=== First admin account created ===`);
  console.log(`  Staff ID (login):  ${identifier}`);
  console.log(`  Temporary password: ${tempPassword}`);
  console.log(`  Log in on the Admin tab with these credentials.`);
  console.log(`  This password is shown only once — copy it now.\n`);

  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to create first admin:", err);
  process.exit(1);
});
