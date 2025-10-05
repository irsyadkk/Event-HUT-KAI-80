import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const User = db.define(
  "users",
  {
    nipp: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    nama: Sequelize.STRING,
    penetapan: Sequelize.INTEGER,
    refresh_token: Sequelize.TEXT,
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);


export default User;
