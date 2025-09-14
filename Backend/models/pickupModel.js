import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";
import User from "./userModel.js";

const Pickup = db.define(
  "pickup",
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
    jumlah_kuota: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    jenis_pengambilan: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    status_pengambilan: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    penanggung_jawab: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    pos_pengambilan: {
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

export default Pickup;
