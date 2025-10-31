// database/connection.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

if (process.env.MONGOOSE_DEBUG === "1") {
  mongoose.set("debug", true);
}

function maskMongoUri(uri) {
  try {
    const u = new URL(uri);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return uri?.replace(/:\/\/.*@/, "://***@");
  }
}

export async function setupDatabaseConnection() {
  const mongoURI = process.env.MONGODB_URI_PLC || "mongodb://localhost:27017/PlcServerDB";
  let retries = Number(process.env.MONGO_RETRIES || 5);

  mongoose.connection.on("connected", () => {
    console.log(`[Mongo] connected → ${maskMongoUri(mongoURI)}`);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[Mongo] disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("[Mongo] reconnected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[Mongo] connection error:", err?.message || err);
  });

  while (retries > 0) {
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
      });
      console.log("MongoDB bağlantısı başarılı!");
      return;
    } catch (error) {
      retries -= 1;
      console.error("MongoDB bağlantı hatası:", error?.message || error);
      console.log(`Tekrar denenecek... Kalan deneme sayısı: ${retries}`);
      if (retries <= 0) {
        console.error("[Mongo] Retry hakkı bitti. Uygulama sonlandırılıyor.");
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}

export async function closeMongo(reason = "shutdown") {
  try {
    if (mongoose.connection.readyState !== 0) {
      console.log(`[Mongo] closing connection due to ${reason}...`);
      await mongoose.connection.close();
      console.log("[Mongo] connection closed");
    }
  } catch (e) {
    console.error("[Mongo] close error:", e?.message || e);
  }
}
