import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const Admin = db.define(
  "admins",
  {
    nipp: {
      type: Sequelize.TEXT,
      primaryKey: true,
      allowNull: false,
    },
    password: Sequelize.TEXT,
    refresh_token: Sequelize.TEXT,
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

db.sync().then(() => console.log("Database admins synced"));

export default Admin;
