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

export function clearPingTimer() {
  try {
    if (pingTimer) clearInterval(pingTimer);
  } catch {}
  pingTimer = null;
}

export function clearFlushTimer() {
  try {
    if (flushTimer) clearInterval(flushTimer);
  } catch {}
  flushTimer = null;
}

export function clearTimers() {
  clearPingTimer();
  clearFlushTimer();
}
