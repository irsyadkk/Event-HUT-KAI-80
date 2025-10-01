import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const Timer = db.define(
  "timer",
  {
    date: {
      type: Sequelize.DATE,
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
