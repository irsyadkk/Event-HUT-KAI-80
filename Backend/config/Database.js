import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();
const DB_NAME = process.env.DB_NAME;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
// const DB_HOST = process.env.DB_HOST;
// const DB_PORT = process.env.DB_PORT;
const DB_SOCKET_PATH = process.env.DB_HOST;

const db = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    host: DB_SOCKET_PATH,
  },
});

export default db;
