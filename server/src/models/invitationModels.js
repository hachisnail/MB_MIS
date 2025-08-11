import { DataTypes } from "sequelize";
import { mainDb, logsDb } from "../configs/databases.js";
import { addDbChangeHooks } from "../hooks/emitDbChangeHooks.js";

const Invitation = mainDb.define('Invitation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  first_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contact_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  role: {
    type: DataTypes.ENUM('Admin', 'ContentManager', 'Viewer', 'Reviewer'),
    allowNull: true,
    defaultValue: ''
  },
  position: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'invitations',
  timestamps: true
});

addDbChangeHooks(Invitation, "Invitation");

export { Invitation };



