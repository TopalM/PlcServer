// middlewares/state.js

let ws = null;
let flushTimer = null;
let pingTimer = null;

export function setWs(instance) {
  ws = instance;
}
export function setFlushTimer(t) {
  flushTimer = t;
}
export function setPingTimer(t) {
  pingTimer = t;
}

export function getState() {
  return { ws, flushTimer, pingTimer };
}

// --- sadece ping timer'ını temizle
export function clearPingTimer() {
  try {
    if (pingTimer) clearInterval(pingTimer);
  } catch {}
  pingTimer = null;
}

// --- sadece flush timer'ını temizle (şu an plcWsClient bunu çağırmıyor, ama lazım olabilir)
export function clearFlushTimer() {
  try {
    if (flushTimer) clearInterval(flushTimer);
  } catch {}
  flushTimer = null;
}

// --- hepsini temizle (shutdown için)
export function clearTimers() {
  clearPingTimer();
  clearFlushTimer();
}
