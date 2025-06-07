// server/configs/sessionStore.js
import session from "express-session";
import SequelizeStoreLib from "connect-session-sequelize";
import { mainDb } from "./databases.js";  // or wherever your Sequelize instance is

const SequelizeStore = SequelizeStoreLib(session.Store);

const sessionStore = new SequelizeStore({
  db: mainDb,
  tableName: 'Sessions',
  // Optional: checkExpirationInterval, expiration, etc.
});

export default sessionStore;
