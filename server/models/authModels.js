import { DataTypes } from "sequelize";
import { mainDb, logsDb } from "../configs/databases.js";
import { addDbChangeHooks } from "../hooks/emitDbChangeHooks.js";

// Role Model
const Role = mainDb.define("Role", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
}, {
  tableName: "roles",
  timestamps: false,
});

// User Model
const User = mainDb.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
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
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  contact: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: "id",
    },
    allowNull: true,
  },
  position: {
    type: DataTypes.ENUM("Staff", "ContentManager", "Viewer", "Reviewer", "Admin"),
    defaultValue: "Staff",
  },
}, {
  tableName: "users",
  timestamps: true,
});

// UserSession Model
const UserSession = logsDb.define("UserSession", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: "id",
    },
    allowNull: false,
  },
  sessionId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  loginAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: mainDb.literal("CURRENT_TIMESTAMP"), 
  },
  logoutAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: "user_sessions",
  timestamps: false,
});

// Associations
Role.hasMany(User, { foreignKey: "roleId" });
User.belongsTo(Role, { foreignKey: "roleId" });

User.hasMany(UserSession, { foreignKey: "userId" });
UserSession.belongsTo(User, { foreignKey: "userId" });


addDbChangeHooks(Role, "Role");
addDbChangeHooks(User, "User");
addDbChangeHooks(UserSession, "UserSession");

export { mainDb, Role, User, UserSession };
