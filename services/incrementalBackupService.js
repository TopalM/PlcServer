import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";
import dotenv from "dotenv";
import { uploadToYandexDisk, createFolderOnYandex } from "../middleware/yandexDisk.js";
import sendMailServices from "./sendMailService.js";

dayjs.extend(utc);
dayjs.extend(tz);
dotenv.config();

// ---- ZORUNLU: .env'de MONGODB_URI_PLC olmalı ----
const MONGODB_URI_PLC = (process.env.MONGODB_URI_PLC || "").trim();
if (!MONGODB_URI_PLC) {
  throw new Error("MONGODB_URI_PLC boş olamaz (.env'den gelmeli).");
}

// ---- Varsayılanlar (yeni env gerektirmez) ----
const MONGODUMP_BIN = (process.env.MONGODUMP_BIN || "mongodump").trim();
const BACKUP_LOCAL_DIR = (process.env.BACKUP_LOCAL_DIR || "backups/incremental").trim();
// 1 = dün (artımlı)
const BACKUP_DAY_OFFSET = Number.isFinite(parseInt(process.env.BACKUP_DAY_OFFSET, 10)) ? parseInt(process.env.BACKUP_DAY_OFFSET, 10) : 1;

// E-posta alıcısı: mevcut env’lerden biri varsa onu kullan
const MAIL_TO =
  (process.env.SHIPMENT_REPORT_TO && process.env.SHIPMENT_REPORT_TO.trim()) ||
  (process.env.MAIN_ACCOUNT_MAIL_ADRESS && process.env.MAIN_ACCOUNT_MAIL_ADRESS.trim()) ||
  (process.env.ACCOUNT_MAIL_ADDRESS && process.env.ACCOUNT_MAIL_ADDRESS.trim()) ||
  (process.env.MAIL_ADDRESS && process.env.MAIL_ADDRESS.trim()) ||
  "Mustafa.Topal@Plastifay.com.tr";

// Artımlı alınacak koleksiyonlar (env varsa onu kullanır)
const COLLECTIONS = process.env.BACKUP_COLLECTIONS
  ? process.env.BACKUP_COLLECTIONS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [
      "auxiliaryFacilitiesData",
      "electricCounterData",
      "filterPressData",
      "naturalGasCounterData",
      "reactor1Data",
      "reactor2Data",
      "reactor3Data",
      "reactor4Data",
      "reactor5Data",
      "reactor6Data",
      "reactor7Data",
      "reactor8Data",
      "scrubber1Data",
      "scrubber2Data",
      "tankFarmData",
      "waterCounterData",
    ];

function dbNameFromUri(uri) {
  try {
    const afterSlash = uri.split("://")[1].split("/")[1] || "";
    return afterSlash.split("?")[0] || "unknownDB";
  } catch {
    return "unknownDB";
  }
}

// Dün (IST) 00:00 → bugün 00:00 aralığı [start, end)
function istDayWindowUTC(offsetDays = BACKUP_DAY_OFFSET) {
  const target = dayjs().tz("Europe/Istanbul").subtract(offsetDays, "day");
  const startIST = target.startOf("day");
  const endIST = startIST.add(1, "day");
  return {
    startUTC: startIST.utc().toDate().toISOString(),
    endUTC: endIST.utc().toDate().toISOString(),
    dayLabel: startIST.format("YYYY-MM-DD"),
  };
}

function execFilep(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

export async function backupIncrementalMongoAndUpload() {
  const dbName = dbNameFromUri(MONGODB_URI_PLC); // Örn: PlcServerDB
  const { startUTC, endUTC, dayLabel } = istDayWindowUTC(); // Örn: 2025-11-01

  // Yerel çıktı
  const outDir = path.resolve(BACKUP_LOCAL_DIR, dayLabel); // backups/incremental/2025-11-01
  const archive = `${outDir}.tar.gz`; // backups/incremental/2025-11-01.tar.gz

  // Yandex yolu → PlastifayMaintenance/backup/Plc-Yedek/YYYY-MM/mongo-incr-YYYY-MM-DD.tar.gz
  const yMonth = dayLabel.slice(0, 7); // YYYY-MM
  const yFolder = `/PlastifayMaintenance/backup/Plc-Yedek/${yMonth}`;
  const yPath = `${yFolder}/mongo-incr-${dayLabel}.tar.gz`;

  // Sorgu filtresi (DataTime alanı)
  const filter = { DataTime: { $gte: { $date: startUTC }, $lt: { $date: endUTC } } };
  const queryArg = JSON.stringify(filter);

  try {
    fs.mkdirSync(outDir, { recursive: true });

    // Koleksiyonları dump et
    for (const col of COLLECTIONS) {
      const args = [`--uri=${MONGODB_URI_PLC}`, `--collection=${col}`, `--query=${queryArg}`, `--out=${outDir}`];
      console.log(`[INCR] dump → ${col}`);
      await execFilep(MONGODUMP_BIN, args, { maxBuffer: 1024 * 1024 * 64 });
    }

    // Arşivle
    console.log(`[INCR] archive → ${archive}`);
    await execFilep("tar", ["-C", path.dirname(outDir), "-czf", archive, path.basename(outDir)]);

    // Yandex klasörünü garanti et ve yükle
    await createFolderOnYandex({ yandexDiskPath: yFolder });
    console.log(`[INCR] upload → ${yPath}`);
    const up = await uploadToYandexDisk({ localFilePath: archive, yandexDiskPath: yPath });
    if (!up?.success) throw new Error(`Yandex yükleme başarısız: ${up?.error || "bilinmiyor"}`);

    // Temizlik
    try {
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch {}
    try {
      fs.rmSync(archive, { force: true });
    } catch {}

    // Mail bilgilendirme
    const maskedUri = MONGODB_URI_PLC.replace(/:.+@/, "://****@");
    await sendMailServices(
      MAIL_TO,
      "✅ Günlük Artımlı MongoDB Yedeği Tamamlandı",
      `
      <div style="font-family:Arial;padding:16px;background:#e8f5e9;border:1px solid #2e7d32;border-radius:8px">
        <h3 style="margin:0 0 8px;color:#2e7d32">Günlük artımlı yedek başarıyla oluşturuldu</h3>
        <p><b>Kaynak:</b> ${maskedUri}</p>
        <p><b>Veritabanı:</b> ${dbName}</p>
        <p><b>Gün:</b> ${dayLabel} (IST 00:00–24:00)</p>
        <p><b>Yandex:</b> ${yPath}</p>
      </div>`
    );

    console.log("[INCR] OK");
    return true;
  } catch (err) {
    const msg = `${err?.message || err}`;
    const tail = (err?.stderr || "").toString().slice(-4000);
    console.error("[INCR] HATA:", msg);
    if (tail) console.error("[INCR] STDERR TAIL:", tail);

    const maskedUri = MONGODB_URI_PLC.replace(/:.+@/, "://****@");
    await sendMailServices(
      MAIL_TO,
      "❌ Günlük Artımlı MongoDB Yedek Hatası",
      `
      <div style="font-family:Arial;padding:16px;background:#ffebee;border:1px solid #c62828;border-radius:8px">
        <h3 style="margin:0 0 8px;color:#c62828">Yedek alınamadı</h3>
        <p><b>Kaynak:</b> ${maskedUri}</p>
        <p><b>Veritabanı:</b> ${dbName}</p>
        <p><b>Gün:</b> ${dayLabel}</p>
        <pre style="white-space:pre-wrap;color:#b71c1c">${msg}</pre>
      </div>`
    );
    throw err;
  }
}
