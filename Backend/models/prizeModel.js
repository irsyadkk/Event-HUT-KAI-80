import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";

const Prize = db.define(
  "prizes",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    prize: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    pemenang: {
      type: Sequelize.BLOB,
      allowNull: true,
    },
    status: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

db.sync().then(() => console.log("Database prizes synced"));

export default Prize;
