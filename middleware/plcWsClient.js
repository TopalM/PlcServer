// middlewares/plcWsClient.js
import WebSocket from "ws";
import { decryptFromServerBase64 } from "./dataCrypto.js";
import { pickMapper } from "../models/mappers/index.js";
import { modelFor } from "./plcModelRouter.js";

/** Ortak ayarlar */
const { WSS_URL, JSONWEBTOKEN, SNAPSHOT_INTERVAL_MS } = process.env;
const SAVE_EVERY_MS = Number(SNAPSHOT_INTERVAL_MS || 60_000);

/** Son görülen verileri tutan tampon (her PLC adı için) */
const lastSeen = new Map();
/** Son yazılan dakika damgası (aynı dakikaya ikinci kez yazmamak için) */
const lastFlushedKey = new Map();

let ws;
let attempts = 0;
let flushTimer;

export function startPlcWebsocketListener() {
  if (!WSS_URL) {
    console.error("WSS_URL boş olamaz. .env dosyasını kontrol et.");
    return;
  }
  connect();
  startFlushLoop();
}

function connect() {
  const url = new URL(WSS_URL);
  if (JSONWEBTOKEN) url.searchParams.set("token", JSONWEBTOKEN);

  ws = new WebSocket(url.toString(), {
    headers: JSONWEBTOKEN ? { Authorization: `Bearer ${JSONWEBTOKEN}` } : undefined,
  });

  ws.on("open", () => {
    attempts = 0;
    console.log("[PLC-WS] connected");
  });

  ws.on("message", (data) => {
    const text = decryptFromServerBase64(data);
    let obj;
    try {
      obj = JSON.parse(text);
    } catch {
      // Bazı kaynaklar düz metin gelebilir
      console.log("[PLC-WS DATA] (text)", text);
      return;
    }

    // Beklenen format:
    // { timestamp, data: { PLC_TankFarm: {...}, PLC_1: {...}, ... } }
    const ts = obj?.timestamp ? new Date(obj.timestamp) : new Date();
    const buckets = obj?.data || {};
    for (const [plcName, payload] of Object.entries(buckets)) {
      // Mapper + Model
      const mapper = pickMapper(plcName);
      const Model = modelFor(plcName);
      if (!Model) {
        console.warn("[PLC-WS] Model bulunamadı:", plcName);
        continue;
      }

      // Map'lenmiş snapshot'ı tamponla
      const mapped = mapper(payload || {});
      lastSeen.set(plcName, { DataTime: ts, body: mapped, Model });
    }
  });

  ws.on("close", (code, reason) => {
    console.warn("[PLC-WS] closed:", code, reason?.toString?.() || "");
    reconnect();
  });

  ws.on("error", (err) => {
    console.error("[PLC-WS] error:", err.message);
  });
}

function reconnect() {
  attempts += 1;
  const backoff = Math.min(30000, 1000 * Math.pow(2, attempts));
  console.log(`[PLC-WS] reconnecting in ${backoff} ms`);
  setTimeout(connect, backoff);
}

function startFlushLoop() {
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(async () => {
    if (lastSeen.size === 0) return;

    const entries = Array.from(lastSeen.entries());
    for (const [plcName, { DataTime, body, Model }] of entries) {
      try {
        // Dakika başına yuvarla: (örn. 13:43:08 → 13:43:00)
        const minuteKey = new Date(DataTime);
        minuteKey.setSeconds(0, 0);

        const key = `${plcName}|${minuteKey.toISOString()}`;
        if (lastFlushedKey.get(plcName) === key) {
          continue; // aynı dakikaya ikinci kez yazma
        }

        // Kayıt objesi
        const doc = new Model({
          DataTime: minuteKey, // dakikalık snapshot
          ...body,
        });

        await doc.save();
        lastFlushedKey.set(plcName, key);
        // console.log(`[FLUSH] ${plcName} @ ${minuteKey.toISOString()}`);
      } catch (e) {
        console.error(`[FLUSH ERR] ${plcName}:`, e?.message || e);
      }
    }
  }, SAVE_EVERY_MS);
}
