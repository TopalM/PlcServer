// middlewares/plcWsClient.js
import WebSocket from "ws";
import { decryptFromServerBase64 } from "./dataCrypto.js";
import { pickMapper } from "../models/mappers/index.js";
import { modelFor } from "./plcModelRouter.js";
import {
  setWs,
  setFlushTimer,
  setPingTimer,
  clearPingTimer, // yalnızca ping'i temizleyeceğiz
  getState,
} from "./state.js";

/** Ortak ayarlar (.env) */
const { WSS_URL, JSONWEBTOKEN, SNAPSHOT_INTERVAL_MS, DEBUG_FLUSH } = process.env;
const SAVE_EVERY_MS = Number(SNAPSHOT_INTERVAL_MS || 60_000);

/** Son görülen verileri tutan tampon (her PLC adı için) */
const lastSeen = new Map();
/** Son yazılan dakika anahtarı (aynı dakikaya ikinci kez yazmamak için) */
const lastFlushedKey = new Map();

/** İç durum */
let attempts = 0;
let flushing = false;
let alive = false;

/** Dışa açık başlatıcı */
export function startPlcWebsocketListener() {
  if (!WSS_URL) {
    console.error("WSS_URL boş olamaz. .env dosyasını kontrol et.");
    return;
  }
  connect();
  startFlushLoop(); // ilk kurulum
}

/** Bağlan */
function connect() {
  const url = new URL(WSS_URL);
  if (JSONWEBTOKEN) url.searchParams.set("token", JSONWEBTOKEN);

  const ws = new WebSocket(url.toString(), {
    headers: JSONWEBTOKEN ? { Authorization: `Bearer ${JSONWEBTOKEN}` } : undefined,
    perMessageDeflate: false,
    handshakeTimeout: 10_000, // 10s
    maxPayload: 4 * 1024 * 1024, // 4MB
  });

  setWs(ws);

  ws.on("open", () => {
    attempts = 0;
    console.log("[PLC-WS] connected");
    alive = true;

    // Heartbeat: 20sn’de bir ping; 20sn içinde pong yoksa kapat
    try {
      const { pingTimer } = getState();
      if (pingTimer) clearInterval(pingTimer);
    } catch {}
    const pt = setInterval(() => {
      try {
        const { ws: curr } = getState();
        if (!curr || curr.readyState !== WebSocket.OPEN) return;

        alive = false;
        curr.ping();

        setTimeout(() => {
          if (!alive && curr?.readyState === WebSocket.OPEN) {
            console.warn("[PLC-WS] heartbeat timeout → terminate");
            try {
              curr.terminate();
            } catch {}
          }
        }, 20_000);
      } catch {}
    }, 20_000);
    setPingTimer(pt);

    // kopma sonrasında flush döngüsü durmuşsa tekrar garantiye al
    ensureFlushLoop();
  });

  ws.on("pong", () => {
    alive = true;
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
    // sadece ping timer’ını temizle; flush çalışır kalsın
    clearPingTimer();
    reconnect();
  });

  ws.on("error", (err) => {
    console.error("[PLC-WS] error:", err?.message || err);
  });
}

/** Jitter’lı exponential backoff ile yeniden bağlan */
function reconnect() {
  attempts += 1;
  const base = Math.min(30_000, 1000 * Math.pow(2, attempts));
  const jitter = Math.floor(Math.random() * 2000);
  const wait = base + jitter;
  console.log(`[PLC-WS] reconnecting in ${wait} ms`);
  setTimeout(connect, wait);
}

/** flush döngüsünün kurulu olduğunu garanti et */
function ensureFlushLoop() {
  const { flushTimer } = getState();
  if (flushTimer) return; // zaten çalışıyor
  startFlushLoop();
}

/** Dakikalık snapshot flush döngüsü (idempotent upsert) */
function startFlushLoop() {
  // Zaten kuruluysa tekrar kurma
  const { flushTimer } = getState();
  if (flushTimer) return;

  const t = setInterval(async () => {
    if (flushing) return;
    if (lastSeen.size === 0) return;

    flushing = true;
    const entries = Array.from(lastSeen.entries());

    for (const [plcName, { DataTime, body, Model }] of entries) {
      try {
        // Dakikaya yuvarla: (örn. 13:43:08 → 13:43:00)
        const minuteKey = new Date(DataTime);
        minuteKey.setSeconds(0, 0);

        const key = `${plcName}|${minuteKey.toISOString()}`;
        if (lastFlushedKey.get(plcName) === key) continue; // aynı dakikaya ikinci kez yazma

        // Idempotent: Upsert
        await Model.updateOne(
          { DataTime: minuteKey }, // aynı dakikaya tek kayıt
          { $set: { DataTime: minuteKey, ...body } },
          { upsert: true }
        );

        lastFlushedKey.set(plcName, key);

        // İsteğe bağlı debug
        if (DEBUG_FLUSH === "1") {
          console.log(`[FLUSH] ${plcName} @ ${minuteKey.toISOString()}`);
        }
      } catch (e) {
        console.error(`[FLUSH ERR] ${plcName}:`, e?.message || e);
      }
    }

    flushing = false;
  }, SAVE_EVERY_MS);

  setFlushTimer(t);
}

export { startFlushLoop }; // ensureFlushLoop/testler için
