import mongoose from "mongoose";

/** ---------- Helpers ---------- **/
const toNumberOrNaN = (v) => {
  if (v == null) return NaN;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
};
const clampToRangeOrDrop = (n, min, max) => {
  const x = toNumberOrNaN(n);
  if (!Number.isFinite(x)) return undefined;
  if (min != null && x < min) return undefined;
  if (max != null && x > max) return undefined;
  return x;
};
const sanitizeRound = (places, min, max) => (v) => {
  const inRange = clampToRangeOrDrop(v, min, max);
  if (inRange == null) return undefined;
  const f = 10 ** places;
  return Math.round(inRange * f) / f;
};
const isFiniteNumber = (v) => Number.isFinite(toNumberOrNaN(v));

/** ---------- Precision & Limits (from original) ---------- **/
const PRECISION = {
  Water_General_Flow_Speed_m_sn: 0,
  Water_General_Volume_Flow_m3_sn: 0,
  Water_General_Mass_Flow_kg_sn: 0,
  Water_General_Operating_Time_sn: 1,
  Water_General_Endex: 1,
  Water_General_Counter_2_m3_or_kg: 1,
  Water_Cooling_Tower_Flow_Speed_m_sn: 0,
  Water_Cooling_Tower_Volume_Flow_m3_sn: 0,
  Water_Cooling_Tower_Mass_Flow_kg_sn: 0,
  Water_Cooling_Tower_Operating_Time_sn: 1,
  Water_Cooling_Tower_Endex: 1,
  Water_Cooling_Tower_Counter_2_m3_or_kg: 1,
  Water_Production_Flow_Speed_m_sn: 0,
  Water_Production_Volume_Flow_m3_sn: 0,
  Water_Production_Mass_Flow_kg_sn: 0,
  Water_Production_Operating_Time_sn: 1,
  Water_Production_Endex: 1,
  Water_Production_Counter_2_m3_or_kg: 1,
};

const LIMITS = {
  Water_General_Flow_Speed_m_sn: { min: -10, max: 10 },
  Water_Cooling_Tower_Flow_Speed_m_sn: { min: -10, max: 10 },
  Water_Production_Flow_Speed_m_sn: { min: -10, max: 10 },
  Water_General_Volume_Flow_m3_sn: { min: -10, max: 10 },
  Water_Cooling_Tower_Volume_Flow_m3_sn: { min: -10, max: 10 },
  Water_Production_Volume_Flow_m3_sn: { min: -10, max: 10 },
  Water_General_Mass_Flow_kg_sn: { min: -10, max: 10 },
  Water_Cooling_Tower_Mass_Flow_kg_sn: { min: -10, max: 10 },
  Water_Production_Mass_Flow_kg_sn: { min: -10, max: 10 },
  Water_General_Operating_Time_sn: { min: -1e9, max: 1e9 },
  Water_Cooling_Tower_Operating_Time_sn: { min: -1e9, max: 1e9 },
  Water_Production_Operating_Time_sn: { min: -1e9, max: 1e9 },
  Water_General_Endex: { min: -1e10, max: 1e10 },
  Water_Cooling_Tower_Endex: { min: -1e10, max: 1e10 },
  Water_Production_Endex: { min: -1e10, max: 1e10 },
  Water_General_Counter_2_m3_or_kg: { min: -1e10, max: 1e10 },
  Water_Cooling_Tower_Counter_2_m3_or_kg: { min: -1e10, max: 1e10 },
  Water_Production_Counter_2_m3_or_kg: { min: -1e10, max: 1e10 },
};

export default function makeWaterCounterData(plcConn) {
  const waterCounterSchema = new mongoose.Schema(
    {
      DataTime: { type: Date, required: true, index: true },

      Water_General_Flow_Speed_m_sn: { type: Number },
      Water_General_Volume_Flow_m3_sn: { type: Number },
      Water_General_Mass_Flow_kg_sn: { type: Number },
      Water_General_Operating_Time_sn: { type: Number },
      Water_General_Endex: { type: Number },
      Water_General_Counter_2_m3_or_kg: { type: Number },

      Water_Cooling_Tower_Flow_Speed_m_sn: { type: Number },
      Water_Cooling_Tower_Volume_Flow_m3_sn: { type: Number },
      Water_Cooling_Tower_Mass_Flow_kg_sn: { type: Number },
      Water_Cooling_Tower_Operating_Time_sn: { type: Number },
      Water_Cooling_Tower_Endex: { type: Number },
      Water_Cooling_Tower_Counter_2_m3_or_kg: { type: Number },

      Water_Production_Flow_Speed_m_sn: { type: Number },
      Water_Production_Volume_Flow_m3_sn: { type: Number },
      Water_Production_Mass_Flow_kg_sn: { type: Number },
      Water_Production_Operating_Time_sn: { type: Number },
      Water_Production_Endex: { type: Number },
      Water_Production_Counter_2_m3_or_kg: { type: Number },
    },
    { collection: "waterCounterData", timestamps: false, versionKey: false, strict: true, minimize: true }
  );

  Object.entries(PRECISION).forEach(([path, places]) => {
    const lim = LIMITS[path] || {};
    if (waterCounterSchema.path(path)) {
      waterCounterSchema.path(path).set(sanitizeRound(places, lim.min, lim.max));
    }
  });

  const MONOTONIC_FIELDS = Object.keys(PRECISION).filter((k) => /Endex|Counter_2/i.test(k));

  waterCounterSchema.pre("save", async function (next) {
    if (!this.isNew) return next();
    const last = await this.constructor.findOne().sort({ DataTime: -1 }).lean();
    if (last) {
      const paths = Object.keys(waterCounterSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");
      for (const p of paths) {
        if (this[p] == null && last[p] != null) {
          this[p] = last[p];
          continue;
        }
        if (MONOTONIC_FIELDS.includes(p) && isFiniteNumber(this[p]) && isFiniteNumber(last[p]) && Number(this[p]) < Number(last[p])) {
          this[p] = last[p];
        }
      }
    }
    Object.keys(this.toObject()).forEach((k) => {
      if (this[k] == null) delete this[k];
    });
    next();
  });

  return plcConn.models.WaterCounterData || plcConn.model("WaterCounterData", waterCounterSchema, "waterCounterData");
}
