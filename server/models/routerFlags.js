import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";
import { addDbChangeHooks } from "../hooks/emitDbChangeHooks.js";

const RouterFlags = mainDb.define('RouterFlag', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  route_key: { type: DataTypes.STRING, allowNull: false, unique: true },
  is_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'router_flags',
  timestamps: true,
  indexes: [
    // no role here anymore, route_key should be unique by itself
    { unique: true, fields: ['route_key'] }
  ]
});

addDbChangeHooks(RouterFlags, "RouterFlag");

export default RouterFlags;
