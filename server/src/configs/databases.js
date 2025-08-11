import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const mainDb = new Sequelize(
  
  process.env.DB_NAME_MAIN,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  }
);

export const logsDb = new Sequelize(
  process.env.DB_NAME_LOGS,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  }
);
