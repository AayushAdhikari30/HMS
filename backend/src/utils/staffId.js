import crypto from "crypto";
import { Op } from "sequelize";
import { User } from "../models/index.js";
import { ROLE_ID_PREFIXES } from "../constants.js";


export const generateStaffIdentifier = async (role) => {
  const prefix = ROLE_ID_PREFIXES[role];
  if (!prefix) {
    throw new Error(`No ID prefix configured for role "${role}"`);
  }

  const year = new Date().getFullYear();
  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const countThisYear = await User.count({
    where: {
      role,
      createdAt: { [Op.gte]: yearStart, [Op.lt]: yearEnd },
    },
  });

  const sequence = String(countThisYear + 1).padStart(4, "0");
  return `${prefix}-${year}-${sequence}`;
};

export const generateTempPassword = () => {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const digits = "0123456789";

  const pick = (charset, count) =>
    Array.from({ length: count }, () => charset[crypto.randomInt(charset.length)]).join("");

  return `${pick(letters, 3)}${pick(digits, 3)}${pick(letters, 2)}`;
};
