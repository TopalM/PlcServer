import cron from "node-cron";
import { withMongoLock } from "../utils/withMongoLock.js";
import { backupIncrementalMongoAndUpload } from "../services/incrementalBackupService.js";

export function registerCronJobs() {
  const tz = "Europe/Istanbul";

  // Her gece 01:00'da çalışsın; dünün 00:00–24:00 (IST) aralığını alır
  cron.schedule(
    "0 1 * * *",
    async () => {
      console.log("[CRON 01:00] Günlük artımlı MongoDB yedeği tetiklendi…");
      await withMongoLock("daily-incremental-backup", 15 * 60 * 1000, async () => {
        await backupIncrementalMongoAndUpload();
        console.log("[CRON 01:00] Günlük artımlı MongoDB yedeği tamamlandı.");
      });
    },
    { timezone: tz }
  );
}
