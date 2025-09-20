import express from "express";
import cors from "cors";
import router from "./routes/route.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import { Client as PGClient } from "pg";

dotenv.config();
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split("|") || [];
const app = express();
const server = http.createServer(app);

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
app.get("/", (req, res) => res.send("API running")); // gunakan res.send bukan res.render jika tidak pakai view engine
app.use(router);

/* === Tambahkan Socket.IO === */
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

/* === Koneksi ke Postgres untuk LISTEN/NOTIFY === */
const pgClient = new PGClient({
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: 5432,
});
await pgClient.connect();
await pgClient.query("LISTEN prize_changes");
await pgClient.query("LISTEN winner_changes");

pgClient.on("notification", async (msg) => {
  switch (msg.channel) {
    case "prize_changes": {
      const { rows } = await pgClient.query("SELECT * FROM prizes ORDER BY id");
      io.emit("PRIZE_UPDATE", rows);
      break;
    }
    case "winner_changes": {
      const { rows } = await pgClient.query(
        "SELECT * FROM winners ORDER BY nipp"
      );
      io.emit("WINNER_UPDATE", rows);
      break;
    }
  }
});

/* === Start Server === */
server.listen(5000, () =>
  console.log("Server + WebSocket running on port 5000")
);
