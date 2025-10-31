// models/14_NaturalGasCounterDataModel.js
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

// Monotonic counters helper: if current < last, keep last
const monotonicFix = (curr, last) => {
  const c = toNumberOrNaN(curr);
  const l = toNumberOrNaN(last);
  if (Number.isFinite(c) && Number.isFinite(l) && c < l) return l;
  return curr;
};

const PRECISION = {
  Sicak_Su_Basinc_Bar: 3,
  Sicak_Su_Sicaklik_DegC: 1,
  Sicak_Su_DonusumFaktoru: 2,
  Sicak_Su_Z_ZbOrani1_K: 2,
  Sicak_Su_Korrektor_DahiliSicaklik_DegC: 1,
  Sicak_Su_Korrektor_Batarya_Yuzde: 1,
  Sicak_Su_DmemisAkis1_m3h: 1,
  Sicak_Su_DuzeltilmisAkis1_Sm3h: 1,
  Sicak_Su_DuzeltilmemisHc1_m3: 0,
  Sicak_Su_DuzeltilmisHc1_Sm3: 0,
  Sicak_Su_HataDmemisHc1_m3: 0,
  Sicak_Su_HataDmisHc1_Sm3: 0,

  Bono_Basinc_Bar: 3,
  Bono_Sicaklik_DegC: 1,
  Bono_DonusumFaktoru: 2,
  Bono_Z_ZbOrani1_K: 2,
  Bono_Korrektor_DahiliSicaklik_DegC: 1,
  Bono_Korrektor_Batarya_Yuzde: 1,
  Bono_DmemisAkis1_m3h: 1,
  Bono_DuzeltilmisAkis1_Sm3h: 1,
  Bono_DuzeltilmemisHc1_m3: 0,
  Bono_DuzeltilmisHc1_Sm3: 0,
  Bono_HataDmemisHc1_m3: 0,
  Bono_HataDmisHc1_Sm3: 0,

  Kobe_Petniz_Basinc_Bar: 3,
  Kobe_Petniz_Sicaklik_DegC: 1,
  Kobe_Petniz_DonusumFaktoru: 2,
  Kobe_Petniz_Z_ZbOrani1_K: 2,
  Kobe_Petniz_Korrektor_DahiliSicaklik_DegC: 1,
  Kobe_Petniz_Korrektor_Batarya_Yuzde: 1,
  Kobe_Petniz_DmemisAkis1_m3h: 1,
  Kobe_Petniz_DuzeltilmisAkis1_Sm3h: 1,
  Kobe_Petniz_DuzeltilmemisHc1_m3: 0,
  Kobe_Petniz_DuzeltilmisHc1_Sm3: 0,
  Kobe_Petniz_HataDmemisHc1_m3: 0,
  Kobe_Petniz_HataDmisHc1_Sm3: 0,
};

const LIMITS = {
  Sicak_Su_Basinc_Bar: { min: -10, max: 10 },
  Bono_Basinc_Bar: { min: -10, max: 10 },
  Kobe_Petniz_Basinc_Bar: { min: -10, max: 10 },
  Sicak_Su_Sicaklik_DegC: { min: -120, max: 120 },
  Bono_Sicaklik_DegC: { min: -120, max: 120 },
  Kobe_Petniz_Sicaklik_DegC: { min: -120, max: 120 },
  Sicak_Su_Korrektor_DahiliSicaklik_DegC: { min: -80, max: 80 },
  Bono_Korrektor_DahiliSicaklik_DegC: { min: -80, max: 80 },
  Kobe_Petniz_Korrektor_DahiliSicaklik_DegC: { min: -80, max: 80 },
  Sicak_Su_Korrektor_Batarya_Yuzde: { min: -100, max: 100 },
  Bono_Korrektor_Batarya_Yuzde: { min: -100, max: 100 },
  Kobe_Petniz_Korrektor_Batarya_Yuzde: { min: -100, max: 100 },
  Sicak_Su_DonusumFaktoru: { min: -5, max: 5 },
  Bono_DonusumFaktoru: { min: -5, max: 5 },
  Kobe_Petniz_DonusumFaktoru: { min: -5, max: 5 },
  Sicak_Su_Z_ZbOrani1_K: { min: -1, max: 1 },
  Bono_Z_ZbOrani1_K: { min: -1, max: 1 },
  Kobe_Petniz_Z_ZbOrani1_K: { min: -1, max: 1 },
  Sicak_Su_DmemisAkis1_m3h: { min: -10_000, max: 10_000 },
  Sicak_Su_DuzeltilmisAkis1_Sm3h: { min: -10_000, max: 10_000 },
  Bono_DmemisAkis1_m3h: { min: -10_000, max: 10_000 },
  Bono_DuzeltilmisAkis1_Sm3h: { min: -10_000, max: 10000 },
  Kobe_Petniz_DmemisAkis1_m3h: { min: -10_000, max: 10000 },
  Kobe_Petniz_DuzeltilmisAkis1_Sm3h: { min: -10_000, max: 10000 },
  Sicak_Su_DuzeltilmemisHc1_m3: { min: -1e12, max: 1e12 },
  Sicak_Su_DuzeltilmisHc1_Sm3: { min: -1e12, max: 1e12 },
  Sicak_Su_HataDmemisHc1_m3: { min: -1e12, max: 1e12 },
  Sicak_Su_HataDmisHc1_Sm3: { min: -1e12, max: 1e12 },
  Bono_DuzeltilmemisHc1_m3: { min: -1e12, max: 1e12 },
  Bono_DuzeltilmisHc1_Sm3: { min: -1e12, max: 1e12 },
  Bono_HataDmemisHc1_m3: { min: -1e12, max: 1e12 },
  Bono_HataDmisHc1_Sm3: { min: -1e12, max: 1e12 },
  Kobe_Petniz_DuzeltilmemisHc1_m3: { min: -1e12, max: 1e12 },
  Kobe_Petniz_DuzeltilmisHc1_Sm3: { min: -1e12, max: 1e12 },
  Kobe_Petniz_HataDmemisHc1_m3: { min: -1e12, max: 1e12 },
  Kobe_Petniz_HataDmisHc1_Sm3: { min: -1e12, max: 1e12 },
};

export default function makeNaturalGasCounterDataModel(plcConn) {
  const naturalGasCounterSchema = new mongoose.Schema(
    {
      DataTime: { type: Date, required: true, index: true },

      Sicak_Su_Basinc_Bar: { type: Number },
      Sicak_Su_Sicaklik_DegC: { type: Number },
      Sicak_Su_DonusumFaktoru: { type: Number },
      Sicak_Su_Z_ZbOrani1_K: { type: Number },
      Sicak_Su_Korrektor_DahiliSicaklik_DegC: { type: Number },
      Sicak_Su_Korrektor_Batarya_Yuzde: { type: Number },
      Sicak_Su_DmemisAkis1_m3h: { type: Number },
      Sicak_Su_DuzeltilmisAkis1_Sm3h: { type: Number },
      Sicak_Su_DuzeltilmemisHc1_m3: { type: Number },
      Sicak_Su_DuzeltilmisHc1_Sm3: { type: Number },
      Sicak_Su_HataDmemisHc1_m3: { type: Number },
      Sicak_Su_HataDmisHc1_Sm3: { type: Number },

      Bono_Basinc_Bar: { type: Number },
      Bono_Sicaklik_DegC: { type: Number },
      Bono_DonusumFaktoru: { type: Number },
      Bono_Z_ZbOrani1_K: { type: Number },
      Bono_Korrektor_DahiliSicaklik_DegC: { type: Number },
      Bono_Korrektor_Batarya_Yuzde: { type: Number },
      Bono_DmemisAkis1_m3h: { type: Number },
      Bono_DuzeltilmisAkis1_Sm3h: { type: Number },
      Bono_DuzeltilmemisHc1_m3: { type: Number },
      Bono_DuzeltilmisHc1_Sm3: { type: Number },
      Bono_HataDmemisHc1_m3: { type: Number },
      Bono_HataDmisHc1_Sm3: { type: Number },

      Kobe_Petniz_Basinc_Bar: { type: Number },
      Kobe_Petniz_Sicaklik_DegC: { type: Number },
      Kobe_Petniz_DonusumFaktoru: { type: Number },
      Kobe_Petniz_Z_ZbOrani1_K: { type: Number },
      Kobe_Petniz_Korrektor_DahiliSicaklik_DegC: { type: Number },
      Kobe_Petniz_Korrektor_Batarya_Yuzde: { type: Number },
      Kobe_Petniz_DmemisAkis1_m3h: { type: Number },
      Kobe_Petniz_DuzeltilmisAkis1_Sm3h: { type: Number },
      Kobe_Petniz_DuzeltilmemisHc1_m3: { type: Number },
      Kobe_Petniz_DuzeltilmisHc1_Sm3: { type: Number },
      Kobe_Petniz_HataDmemisHc1_m3: { type: Number },
      Kobe_Petniz_HataDmisHc1_Sm3: { type: Number },
    },
    {
      collection: "naturalGasCounterData",
      timestamps: false,
      versionKey: false,
      strict: true,
      minimize: true,
    }
  );

  Object.entries(PRECISION).forEach(([path, places]) => {
    const lim = LIMITS[path] || {};
    if (naturalGasCounterSchema.path(path)) {
      naturalGasCounterSchema.path(path).set(sanitizeRound(places, lim.min, lim.max));
    }
  });

  const MONO_FIELDS = Object.keys(PRECISION).filter((k) => /Hc1|Endex|Counter/i.test(k));

  naturalGasCounterSchema.pre("save", async function (next) {
    if (!this.isNew) return next();
    const last = await this.constructor.findOne().sort({ DataTime: -1 }).lean();
    if (last) {
      const paths = Object.keys(naturalGasCounterSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");
      for (const p of paths) {
        if (this[p] == null && last[p] != null) {
          this[p] = last[p];
          continue;
        }
        if (MONO_FIELDS.includes(p)) {
          this[p] = monotonicFix(this[p], last[p]);
        }
      }
    }
    Object.keys(this.toObject()).forEach((k) => {
      if (this[k] == null) delete this[k];
    });
    next();
  });

  return plcConn.models.NaturalGasCounterData || plcConn.model("NaturalGasCounterData", naturalGasCounterSchema, "naturalGasCounterData");
}
