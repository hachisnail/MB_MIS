import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";
import { addDbChangeHooks } from "../hooks/emitDbChangeHooks.js";

const RouterFlags = mainDb.define('RouterFlag', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  route_key: { type: DataTypes.STRING, allowNull: false, unique: true },
  is_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_public: { type: DataTypes.BOOLEAN, defaultValue: false },
  backup_json: { type: DataTypes.TEXT, allowNull: true }, // <-- NEW FIELD
}, {
  tableName: 'router_flags',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['route_key'] }
  ]
});

addDbChangeHooks(RouterFlags, "RouterFlag");

export default RouterFlags;

