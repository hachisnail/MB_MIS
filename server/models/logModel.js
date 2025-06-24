import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";
import { addDbChangeHooks } from "../hooks/emitDbChangeHooks.js";
import { User } from "./authModels.js";

const Log = mainDb.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  action: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'soft_delete'),
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  beforeState: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  afterState: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'logs',
  timestamps: true,
  updatedAt: false,
});


User.hasMany(Log, { foreignKey: 'userId' });
Log.belongsTo(User, { foreignKey: 'userId' });

addDbChangeHooks(Log, "Log");

export { Log };
