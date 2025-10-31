// --- ZAMAN DAMGALI LOG ---
{
  const orig = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };
  const stamp = (level, args) => {
    const ts = new Date().toISOString();
    orig[level](`[${ts}]`, ...args);
  };
  console.log = (...a) => stamp("log", a);
  console.warn = (...a) => stamp("warn", a);
  console.error = (...a) => stamp("error", a);
}

// --- FATAL HATA YAKALAYICILARI ---
process.on("uncaughtException", (e) => {
  console.error("[FATAL] uncaughtException:", e?.stack || e);
});
process.on("unhandledRejection", (e) => {
  console.error("[FATAL] unhandledRejection:", e?.stack || e);
});

import { startInfrastructure } from "./middleware/init.js";
import { startPlcWebsocketListener } from "./middleware/plcWsClient.js";
import { getState, clearTimers } from "./middleware/state.js";

/**
 * Sadece tetikleme
 */
(async () => {
  try {
    await startInfrastructure(); // DB → Modelleri yükle
    startPlcWebsocketListener(); // WS dinleyiciyi başlat
  } catch (e) {
    console.error("[Init] başlangıç hatası:", e?.message || e);
    process.exit(1);
  }
})();

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log("\nShutting down...");
  try {
    const { ws } = getState();

    // timer’ları temizle
    clearTimers();

    // WS açık ise kibarca kapat (1s ver)
    if (ws && ws.readyState === 1 /* OPEN */) {
      try {
        ws.close(1000, "SIGTERM");
      } catch {}
      await new Promise((res) => setTimeout(res, 1000));
    }
  } catch {}
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
