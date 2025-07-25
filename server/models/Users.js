// server/models/Users.js
import { DataTypes } from 'sequelize';
import { mainDb as sequelize } from './authModels.js'; // adjust if you use another DB instance

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  fname: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  lname: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  position: {
    type: DataTypes.ENUM('Staff', 'ContentManager', 'Viewer', 'Reviewer', 'Administrator'),
    allowNull: true,
    defaultValue: 'Staff',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true, // automatically maps to createdAt and updatedAt
});

export default User;
