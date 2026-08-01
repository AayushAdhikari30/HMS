import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { TOKEN_TYPE_LIST } from "../constants.js";

// Single-use tokens for email verification and password reset.
// Only the SHA-256 hash is stored: a leaked database must not hand an attacker
// working reset links. The raw token exists only in the email we send.
const VerificationToken = sequelize.define(
  "VerificationToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...TOKEN_TYPE_LIST),
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "verification_tokens",
    timestamps: true,
    indexes: [
      { fields: ["token_hash"] },
      { fields: ["user_id", "type"] },
    ],
  },
);

export default VerificationToken;
