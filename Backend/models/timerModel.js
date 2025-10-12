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
      type: Sequelize.DATE, // Tipe data ini akan menyimpan waktu persis seperti yang diberikan
      allowNull: true,
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Default untuk baris baru
    },
    ended: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Default untuk baris baru
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
    
    // =======================================================
    // --- TAMBAHKAN HOOKS DI SINI ---
    // =======================================================
    hooks: {
      afterSync: async (options) => {
        try {
          // 1. Cek terlebih dahulu apakah tabel masih kosong
          const count = await Timer.count();
          
          // 2. Jika kosong (count === 0), baru buat data default
          if (count === 0) {
            console.log("Tabel 'timer' kosong, membuat data default...");
            await Timer.create({
              date: "2025-10-05 17:10:00",
              active: false,
              ended: false,
            });
            console.log("Data default untuk 'timer' berhasil dibuat.");
          }
        } catch (error) {
          console.error("Gagal membuat data default untuk timer:", error);
        }
      },
    },
  }
);

export default Timer;