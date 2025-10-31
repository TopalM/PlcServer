// models/9_FilterPressDataModel.js
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

const allowedEnum = (vals) => (v) => {
  if (v == null || v === "") return undefined;
  const n = toNumberOrNaN(v);
  return vals.includes(n) ? n : undefined;
};

/** ---------- Precision & Limits ---------- **/
const PRECISION = {
  DropTank2Agirlik: 0,
  DropTank4Agirlik: 0,
  DropTank6Agirlik: 0,
  DropTank8Agirlik: 0,
  DropTank10Agirlik: 0,
  Pompa12Akim: 0,
  Pompa13Akim: 0,
  Pompa14Akim: 0,
  Pompa15Akim: 0,
};

const LIMITS = {
  DropTank2Agirlik: { min: -50_000, max: 50_000 },
  DropTank4Agirlik: { min: -50_000, max: 50_000 },
  DropTank6Agirlik: { min: -50_000, max: 50_000 },
  DropTank8Agirlik: { min: -50_000, max: 50_000 },
  DropTank10Agirlik: { min: -50_000, max: 50_000 },
  Pompa12Akim: { min: -200, max: 200 },
  Pompa13Akim: { min: -200, max: 200 },
  Pompa14Akim: { min: -200, max: 200 },
  Pompa15Akim: { min: -200, max: 200 },
};

/** ---------- Factory ---------- **/
export default function makeFilterPressDataModel(plcConn) {
  const filterPressSchema = new mongoose.Schema(
    {
      DataTime: { type: Date, required: true, index: true },
      // Ağırlıklar
      DropTank2Agirlik: { type: Number },
      DropTank4Agirlik: { type: Number },
      DropTank6Agirlik: { type: Number },
      DropTank8Agirlik: { type: Number },
      DropTank10Agirlik: { type: Number },
      // Pompalar (Akım)
      Pompa12Akim: { type: Number },
      Pompa13Akim: { type: Number },
      Pompa14Akim: { type: Number },
      Pompa15Akim: { type: Number },
      // Durum sinyalleri (0/1/2)
      ColorPompa12: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorPompa13: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorPompa14: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorPompa15: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorFiltre12: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorFiltre13: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorFiltre14: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorFiltre15: { type: Number, set: allowedEnum([0, 1, 2]) },
      Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
    },
    {
      collection: "filterPressData",
      timestamps: false,
      versionKey: false,
      strict: true,
      minimize: true,
    }
  );

  filterPressSchema.index({ DataTime: -1 });

  Object.entries(PRECISION).forEach(([path, places]) => {
    const lim = LIMITS[path] || {};
    if (filterPressSchema.path(path)) {
      filterPressSchema.path(path).set(sanitizeRound(places, lim.min, lim.max));
    }
  });

  filterPressSchema.pre("save", async function (next) {
    if (!this.isNew) return next();

    const last = await this.constructor.findOne({}, { _id: 0 }).sort({ DataTime: -1 }).lean();

    if (last) {
      const paths = Object.keys(filterPressSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");
      for (const p of paths) {
        if (this[p] == null && last[p] != null) this[p] = last[p];
      }
    }

    Object.keys(this.toObject()).forEach((k) => {
      if (this[k] == null) delete this[k];
    });

    next();
  });

  return plcConn.models.FilterPressData || plcConn.model("FilterPressData", filterPressSchema, "filterPressData");
}
