import { DataTypes } from "sequelize";
import { logsDb } from "../configs/databases.js";

const PasswordResetToken = logsDb.define("PasswordResetToken", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false, // No foreign key constraint
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: "password_reset_tokens",
  timestamps: true,
});

export { PasswordResetToken };
