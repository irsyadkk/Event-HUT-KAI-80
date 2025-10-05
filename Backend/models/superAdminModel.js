import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const SuperAdmin = db.define(
  "superadmins",
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

db.sync().then(() => console.log("Database superadmins synced"));

export default SuperAdmin;
