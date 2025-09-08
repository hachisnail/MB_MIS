// server/src/configs/db.js
import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "museo_bulawan_mis",   // <-- fixed default name
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: process.env.DB_DIALECT || "mysql", // or 'postgres' | 'sqlite' | 'mssql'
    logging: false,
  }
);

export default sequelize;
