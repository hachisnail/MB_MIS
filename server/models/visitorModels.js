import { DataTypes } from 'sequelize';
import { mainDb } from '../configs/databases.js';

const Visitor = mainDb.define('Visitor', {
  visitor_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(30)
  },
  organization: {
    type: DataTypes.STRING(150)
  },
  province: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  barangay: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  city_municipality: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  street: {
    type: DataTypes.STRING(200)
  }
}, {
  tableName: 'visitor',
  timestamps: false
});

export default Visitor;
