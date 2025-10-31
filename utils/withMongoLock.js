import mongoose from "mongoose";

const lockSchema = new mongoose.Schema({ _id: String, until: Date }, { collection: "cronLocks", versionKey: false });

let Lock;
export function getLockModel(conn = mongoose) {
  if (!Lock) Lock = conn.models.CronLock || conn.model("CronLock", lockSchema);
  return Lock;
}

export async function withMongoLock(jobId, ttlMs, fn) {
  const Lock = getLockModel();
  const now = new Date();
  const until = new Date(Date.now() + ttlMs);

  const res = await Lock.findOneAndUpdate(
    { _id: jobId, $or: [{ until: { $lt: now } }, { until: { $exists: false } }] },
    { _id: jobId, until },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  if (res && res.until && res.until > now && res.until <= until) {
    try {
      return await fn();
    } finally {
      await Lock.updateOne({ _id: jobId }, { $set: { until: new Date(0) } }).catch(() => {});
    }
  } else {
    console.log(`[LOCK] ${jobId} atlandı (kilit alınamadı).`);
  }
}
