import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import bcrypt from "bcrypt"; // <-- 1. Import bcrypt

const SuperAdmin = db.define(
  "superadmins",
  {
    nipp: {
      type: Sequelize.TEXT,
      primaryKey: true,
      allowNull: false,
    },
    password: Sequelize.TEXT,
    refresh_token: Sequelize.TEXT,
  },
  {
    freezeTableName: true,
    timestamps: false,
    
    // =======================================================
    // --- TAMBAHKAN HOOKS UNTUK MEMBUAT ADMIN DEFAULT ---
    // =======================================================
    hooks: {
      afterSync: async (options) => {
        try {
          // Cek apakah tabel superadmins masih kosong
          const count = await SuperAdmin.count();

          // Jika kosong, buat superadmin default
          if (count === 0) {
            console.log("Tabel 'superadmins' kosong, membuat data default...");

            // 2. Siapkan password dan salt rounds
            const plainPassword = "0000";
            const saltRounds = 10;

            // 3. Hash password (ini adalah proses async)
            const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
            console.log("Password '0000' berhasil di-hash.");

            // 4. Buat user dengan password yang sudah di-hash
            await SuperAdmin.create({
              nipp: "0000",
              password: hashedPassword,
              refresh_token: null, // Beri nilai null pada awalnya
            });
            console.log("Superadmin default (nipp: 0000) berhasil dibuat.");
          }
        } catch (error) {
          console.error("Gagal membuat superadmin default:", error);
        }
      },
    },
  }
);

export default SuperAdmin;