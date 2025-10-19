import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";
import User from "./userModel.js";

const Order = db.define(
  "orders",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },

    nipp: {
      type: Sequelize.STRING,
      allowNull: false,
      references: { model: User, key: "nipp" },
    },
    nama: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    status: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    qr: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    transportasi: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    keberangkatan: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);


export default Order;
