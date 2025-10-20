// middleware/state.js
// WS ve timer referanslarını tek yerden yönetmek için küçük bir “state” modülü.

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

export function clearTimers() {
  try {
    if (flushTimer) clearInterval(flushTimer);
  } catch {}
  try {
    if (pingTimer) clearInterval(pingTimer);
  } catch {}
  flushTimer = null;
  pingTimer = null;
}
