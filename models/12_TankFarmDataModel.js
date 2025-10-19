import mongoose from "mongoose";

/** ---------- Helpers (same contract as previous set) ---------- **/
// Convert input to number or NaN; treat "", "   ", null, undefined as NaN
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

// sayı mı? aralıkta mı? → N ondalığa yuvarla; değilse undefined (fallback devreye girer)
const sanitizeRound = (places, min, max) => (v) => {
  const inRange = clampToRangeOrDrop(v, min, max);
  if (inRange == null) return undefined;
  const f = 10 ** places;
  return Math.round(inRange * f) / f;
};

// 0/1/2 enum alanlar: geçersizse undefined
const allowedEnum = (vals) => (v) => {
  if (v == null || (typeof v === "string" && v.trim() === "")) return undefined;
  const n = toNumberOrNaN(v);
  return vals.includes(n) ? n : undefined;
};

/** ---------- Precision & Limits (from original) ---------- **/
const PRECISION = {
  Tank_1_Nonil_Alkol_115m3: 1,
  Tank_2_Iso_Butanol_115m3: 1,
  Tank_4_DOTP_115M3_Real: 0,
  Tank_5_DOP_132M3_Real: 0,
  Tank_6_DOA_115M3_Real: 0,
  Tank_7_DBP_115M3_Real: 0,
  Tank_8_WhiteSpirit_65m3: 1,
  Tank_9_DBP_65M3_Real: 0,
  Tank_10_DINP_65m3: 1,
  Tank_11_DIDP_65m3: 1,
  Tank_12_DBM_65M3_Real: 0,
  Tank_13_DBA_65M3_Real: 0,
  Tank_14_DOM_65M3_Real: 0,
  Tank_15_Aritma_65m3: 1,
  Tank_16_N_Butanol_65m3: 1,
  Tank_17_Aritma_350m3: 1,
  Tank_18_Etil_Hexanol_640m3: 1,
  Tank_19_Etil_Hexanol_640m3: 1,
  Tank_20_DOTP_430m3: 1,
  Tank_21_DOTP_430m3: 1,
  Toplam_DOTP_kg: 0,
  Toplam_DOTP_m3: 1,
  Toplam_DOA: 0,
};

const LIMITS = {
  Tank_1_Nonil_Alkol_115m3: { min: -115, max: 115 },
  Tank_2_Iso_Butanol_115m3: { min: -115, max: 115 },
  Tank_4_DOTP_115M3_Real: { min: -115_000, max: 115_000 },
  Tank_5_DOP_132M3_Real: { min: -132_000, max: 132_000 },
  Tank_6_DOA_115M3_Real: { min: -115_000, max: 115_000 },
  Tank_7_DBP_115M3_Real: { min: -115_000, max: 115_000 },
  Tank_8_WhiteSpirit_65m3: { min: -65, max: 65 },
  Tank_9_DBP_65M3_Real: { min: -65_000, max: 65_000 },
  Tank_10_DINP_65m3: { min: -65, max: 65 },
  Tank_11_DIDP_65m3: { min: -65, max: 65 },
  Tank_12_DBM_65M3_Real: { min: -65_000, max: 65_000 },
  Tank_13_DBA_65M3_Real: { min: -65_000, max: 65_000 },
  Tank_14_DOM_65M3_Real: { min: -65_000, max: 65_000 },
  Tank_15_Aritma_65m3: { min: -65, max: 65 },
  Tank_16_N_Butanol_65m3: { min: -65, max: 65 },
  Tank_17_Aritma_350m3: { min: -350, max: 350 },
  Tank_18_Etil_Hexanol_640m3: { min: -640, max: 640 },
  Tank_19_Etil_Hexanol_640m3: { min: -640, max: 640 },
  Tank_20_DOTP_430m3: { min: -430, max: 430 },
  Tank_21_DOTP_430m3: { min: -430, max: 430 },
  Toplam_DOTP_kg: { min: -600_000, max: 600_000 },
  Toplam_DOTP_m3: { min: -1_000, max: 1_000 },
  Toplam_DOA: { min: -600_000, max: 600_000 },
};

/** ---------- Factory ---------- **/
export default function makeTankFarmDataModel(plcConn) {
  const tankFarmDataSchema = new mongoose.Schema(
    {
      DataTime: { type: Date, required: true, index: true },
      Tank_1_Nonil_Alkol_115m3: { type: Number },
      Tank_2_Iso_Butanol_115m3: { type: Number },
      Tank_4_DOTP_115M3_Real: { type: Number },
      Tank_5_DOP_132M3_Real: { type: Number },
      Tank_6_DOA_115M3_Real: { type: Number },
      Tank_7_DBP_115M3_Real: { type: Number },
      Tank_8_WhiteSpirit_65m3: { type: Number },
      Tank_9_DBP_65M3_Real: { type: Number },
      Tank_10_DINP_65m3: { type: Number },
      Tank_11_DIDP_65m3: { type: Number },
      Tank_12_DBM_65M3_Real: { type: Number },
      Tank_13_DBA_65M3_Real: { type: Number },
      Tank_14_DOM_65M3_Real: { type: Number },
      Tank_15_Aritma_65m3: { type: Number },
      Tank_16_N_Butanol_65m3: { type: Number },
      Tank_17_Aritma_350m3: { type: Number },
      Tank_18_Etil_Hexanol_640m3: { type: Number },
      Tank_19_Etil_Hexanol_640m3: { type: Number },
      Tank_20_DOTP_430m3: { type: Number },
      Tank_21_DOTP_430m3: { type: Number },
      Toplam_DOTP_kg: { type: Number },
      Toplam_DOTP_m3: { type: Number },
      Toplam_DOA: { type: Number },
      // enum'lar
      Tank_6_Vana_165_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Tank_13_Vana_165_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Tank_12_Vana_166_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Tank_14_Vana_166_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Tank_19_Vana_166_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Tank_5_Vana_160_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Tank_20_Vana_164_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Tank_21_Vana_164_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Tank_4_Vana_162_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Tank_21_Vana_162_Tanker: { type: Number, set: allowedEnum([0, 1, 2]) },
      Alkol_Kuzey_Cephe_Priz_ile: { type: Number, set: allowedEnum([0, 1, 2]) },
      Alkol_Guney_Cephe_Priz_ile: { type: Number, set: allowedEnum([0, 1, 2]) },
    },
    {
      collection: "tankFarmData",
      timestamps: false,
      versionKey: false,
      strict: true,
      minimize: true,
    }
  );

  Object.entries(PRECISION).forEach(([path, places]) => {
    const lim = LIMITS[path] || {};
    if (tankFarmDataSchema.path(path)) {
      tankFarmDataSchema.path(path).set(sanitizeRound(places, lim.min, lim.max));
    }
  });

  // Fallback to previous record for undefined/invalids; strip remaining null/undefined
  tankFarmDataSchema.pre("save", async function (next) {
    if (!this.isNew) return next();
    const last = await this.constructor.findOne().sort({ DataTime: -1 }).lean();
    if (last) {
      const paths = Object.keys(tankFarmDataSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");
      for (const p of paths) if (this[p] == null && last[p] != null) this[p] = last[p];
    }
    Object.keys(this.toObject()).forEach((k) => {
      if (this[k] == null) delete this[k];
    });
    next();
  });

  return plcConn.models.TankFarmData || plcConn.model("TankFarmData", tankFarmDataSchema, "tankFarmData");
}
