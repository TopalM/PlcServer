// server.js
import { startInfrastructure } from "./middleware/init.js";
import { startPlcWebsocketListener } from "./middleware/plcWsClient.js";

// 🟢 Sadece tetikleme:
(async () => {
  try {
    await startInfrastructure(); // DB → Modeller
    startPlcWebsocketListener(); // WS dinleyici
  } catch (e) {
    console.error("[Init] başlangıç hatası:", e?.message || e);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  process.exit(0);
});
