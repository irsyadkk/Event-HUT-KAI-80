import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const Quota = db.define(
  "quota",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    quota: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    total_quota: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

export default Quota;
