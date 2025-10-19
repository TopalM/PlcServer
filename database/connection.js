import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export async function setupDatabaseConnection() {
  let retries = 5;
  while (retries) {
    try {
      const mongoURI = process.env.MONGODB_URI_PLC || "mongodb://localhost:27017/PlcServerDB";
      await mongoose.connect(mongoURI);
      console.log("MongoDB bağlantısı başarılı!");
      break;
    } catch (error) {
      console.error("MongoDB bağlantı hatası:", error.message);
      retries -= 1;
      console.log(`Tekrar denenecek... Kalan deneme sayısı: ${retries}`);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}
setupDatabaseConnection();
