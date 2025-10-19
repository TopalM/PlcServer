// middlewares/init.js
import { setupDatabaseConnection } from "../database/connection.js";
import { dbsync } from "../database/sync.js";

/**
 * DB bağlantısı + tüm modellerin kayıt/initialize edilmesi
 * Server sadece bunu çağırır.
 */
export async function startInfrastructure() {
  await setupDatabaseConnection(); // önce DB
  await dbsync(); // sonra modeller (mongoose.models* dolu olur)
}
