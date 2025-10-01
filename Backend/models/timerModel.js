import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const Timer = db.define(
  "timer",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: "TIMESTAMP WITHOUT TIME ZONE",
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

db.sync().then(() => console.log("Database timer synced"));

export default Timer;
