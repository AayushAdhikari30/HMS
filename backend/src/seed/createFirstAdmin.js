
import "dotenv/config";
import bcrypt from "bcryptjs";
import sequelize from "../db/connection.js";
import { User, StaffProfile } from "../models/index.js";
import { generateStaffIdentifier, generateTempPassword } from "../utils/staffId.js";
import { ROLES, BCRYPT_SALT_ROUNDS } from "../constants.js";

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.NODE_ENV === "development" });

  const existingAdmin = await User.findOne({ where: { role: ROLES.ADMIN } });
  if (existingAdmin) {
    console.log("An admin already exists:", existingAdmin.identifier);
    console.log("Refusing to create a duplicate first admin. Use the");
    console.log("admin dashboard's staff-creation flow to add more admins.");
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

  console.log("\n=== First admin account created ===");
  console.log("Identifier (login ID): ", identifier);
  console.log("Temporary password:    ", tempPassword);
  console.log("Log in at /login using the Admin tab with the credentials above.");
  console.log("This password is shown only once — it is not stored anywhere in plaintext.\n");

  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to create first admin:", err);
  process.exit(1);
});
