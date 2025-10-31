import WebSocket from "ws";
import { decryptFromServerBase64 } from "./dataCrypto.js";
import { pickMapper } from "../models/mappers/index.js";
import { modelFor } from "./plcModelRouter.js";
import { setWs, setFlushTimer, setPingTimer, clearPingTimer, getState } from "./state.js";

const { WSS_URL, JSONWEBTOKEN, SNAPSHOT_INTERVAL_MS, DEBUG_FLUSH } = process.env;
const SAVE_EVERY_MS = Number(SNAPSHOT_INTERVAL_MS || 60_000);

const lastSeen = new Map();
const lastFlushedKey = new Map();

let attempts = 0;
let flushing = false;
let alive = false;

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

  const ws = new WebSocket(url.toString(), {
    headers: JSONWEBTOKEN ? { Authorization: `Bearer ${JSONWEBTOKEN}` } : undefined,
    perMessageDeflate: false,
    handshakeTimeout: 10_000,
    maxPayload: 4 * 1024 * 1024,
  });

  setWs(ws);

  ws.on("open", () => {
    attempts = 0;
    console.log("[PLC-WS] connected");
    alive = true;

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
      console.log("[PLC-WS DATA] (text)", text);
      return;
    }

    const ts = obj?.timestamp ? new Date(obj.timestamp) : new Date();
    const buckets = obj?.data || {};
    for (const [plcName, payload] of Object.entries(buckets)) {
      const mapper = pickMapper(plcName);
      const Model = modelFor(plcName);
      if (!Model) {
        console.warn("[PLC-WS] Model bulunamadı:", plcName);
        continue;
      }
      const mapped = mapper(payload || {});
      lastSeen.set(plcName, { DataTime: ts, body: mapped, Model });
    }
  });

  ws.on("close", (code, reason) => {
    console.warn("[PLC-WS] closed:", code, reason?.toString?.() || "");
    clearPingTimer();
    reconnect();
  });

  ws.on("error", (err) => {
    console.error("[PLC-WS] error:", err?.message || err);
  });
}

function reconnect() {
  attempts += 1;
  const base = Math.min(30_000, 1000 * Math.pow(2, attempts));
  const jitter = Math.floor(Math.random() * 2000);
  const wait = base + jitter;
  console.log(`[PLC-WS] reconnecting in ${wait} ms`);
  setTimeout(connect, wait);
}

function ensureFlushLoop() {
  const { flushTimer } = getState();
  if (flushTimer) return;
  startFlushLoop();
}

function startFlushLoop() {
  const { flushTimer } = getState();
  if (flushTimer) return;

  const t = setInterval(async () => {
    if (flushing) return;
    if (lastSeen.size === 0) return;

    flushing = true;
    const entries = Array.from(lastSeen.entries());

    for (const [plcName, { DataTime, body, Model }] of entries) {
      try {
        const minuteKey = new Date(DataTime);
        minuteKey.setSeconds(0, 0);

        const key = `${plcName}|${minuteKey.toISOString()}`;
        if (lastFlushedKey.get(plcName) === key) continue;

        await Model.updateOne({ DataTime: minuteKey }, { $set: { DataTime: minuteKey, ...body } }, { upsert: true });

        lastFlushedKey.set(plcName, key);

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

export { startFlushLoop };
