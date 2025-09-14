import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";
import User from "./userModel.js";

const Pickups = db.define(
  "pickups",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    timestamp: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    nipp: {
      type: Sequelize.TEXT,
      allowNull: false,
      references: { model: User, key: "nipp" },
    },
    nama: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    jumlah_kuota: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    jenis_pengambilan: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    pos_pengambilan: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    nipp_pj: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    nama_pj: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    status: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

db.sync().then(() => console.log("Database synced"));

export default Pickups;
