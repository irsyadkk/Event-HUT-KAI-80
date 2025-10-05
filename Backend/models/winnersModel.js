import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";

const Winner = db.define(
  "winners",
  {
    nipp: {
      type: Sequelize.TEXT,
      primaryKey: true,
      allowNull: false,
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


export default Winner;
