import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { Client as PGClient } from "pg";

// Import instance Sequelize (db) dari file konfigurasi Anda
import db from "./config/Database.js";

// Import SEMUA model Anda di sini. Ini penting agar Sequelize tahu
// semua tabel yang harus disinkronkan oleh db.sync().
import "./models/adminModel.js";
import "./models/orderModel.js";
import "./models/pickupModel.js";
import "./models/prizeModel.js";
import "./models/quotaModel.js";
import "./models/userModel.js";
import "./models/winnersModel.js";

// Import router utama Anda
import router from "./routes/route.js";
import Timer from "./models/timerModel.js";

dotenv.config();

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split("|") || [];
const app = express();
const server = http.createServer(app);

/* =================================
   --- Konfigurasi Middleware ---
   ================================= */
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS: Not allowed origin -> " + origin));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.get("/", (req, res) => res.send("API for KAI Event is running"));
app.use(router);

/* =================================
   --- Konfigurasi Socket.IO ---
   ================================= */
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});

io.on("connection", (socket) => {
  console.log(`Socket Client connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`Socket Client disconnected: ${socket.id}`));
});

/* ==================================================
   --- Fungsi Utama untuk Menjalankan Aplikasi ---
   ================================================== */
const startServer = async () => {
  try {
    // 1. Sinkronisasi Database dengan Sequelize (dijalankan satu kali)
    await db.sync();
    console.log("✅ Database & tables synced successfully via Sequelize.");

    // 2. Koneksi ke Postgres untuk fitur LISTEN/NOTIFY
    const pgClient = new PGClient({
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
    });
    await pgClient.connect();
    
    // Daftarkan semua channel yang akan didengarkan
    await pgClient.query("LISTEN prize_changes");
    await pgClient.query("LISTEN winner_changes");
    await pgClient.query("LISTEN timer_changes");
    console.log("✅ PostgreSQL LISTEN channels registered.");

    // Setup listener untuk notifikasi database
    pgClient.on("notification", async (msg) => {
      console.log(`PostgreSQL NOTIFY received on channel: ${msg.channel}`);
      switch (msg.channel) {
        case "prize_changes": {
          const { rows } = await pgClient.query("SELECT * FROM prizes ORDER BY id");
          io.emit("PRIZE_UPDATE", rows);
          
          const { rows: readyRows } = await pgClient.query(`
            SELECT * FROM prizes
            WHERE status IN ('Belum Verifikasi','diambil di daop', 'diambil di tempat')
            ORDER BY id
          `);
          io.emit("PRIZE_READY_UPDATE", readyRows);
          break;
        }

        case "winner_changes": {
          const { rows } = await pgClient.query("SELECT * FROM winners ORDER BY nipp");
          io.emit("WINNER_UPDATE", rows);
          break;
        }

        case "timer_changes": {
          const { rows } = await pgClient.query("SELECT * FROM timer LIMIT 1");
          if (rows.length > 0) {
            const timer = rows[0];

            io.emit("TIMER_UPDATE", {
              ...timer,
              date: timer.date.toISOString(),
            });
          }
          break;
        }
      }
    });

    // 3. Jalankan Server HTTP setelah semua setup database berhasil
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () =>
      console.log(`🚀 Server, WebSocket, and DB Listeners running on port ${PORT}`)
    );

  } catch (error) {
    console.error("❌ Failed to start the server:", error);
  }
};

// Panggil fungsi untuk memulai seluruh aplikasi
startServer();