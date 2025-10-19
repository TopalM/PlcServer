import mongoose from "mongoose";

/** ---------- Yardımcılar ---------- **/

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
  if (inRange == null) return undefined; // geçersizse: undefined → pre-save fallback devreye girer
  const f = 10 ** places;
  return Math.round(inRange * f) / f;
};

const allowedEnum = (vals) => (v) => {
  if (v == null || v === "") return undefined; // geçersiz: pre-save fallback
  const n = toNumberOrNaN(v);
  return vals.includes(n) ? n : undefined;
};

/** ---------- Konfigler ---------- **/

const PRECISION = Object.freeze({
  Temperature: 1,
  SetTemperature: 1,
  ColumnTemperature: 1,
  ColumnSetTemperature: 1,
  HeatExchangerOutTemperature: 1,
  HotOilInletTemperature: 1,
  HotOilOutletTemperature: 1,
  Cooling3WayValveRatio: 0,
  Heating3WayValveRatio: 0,
  VacuumPumpMaxRatio: 1,
  Pressure: 2,
  HotOilFlowmeter: 0,
  HotOilFrequence: 1,
  TransferPumpRPM: 0,
  TransferPumpCurrent: 1,
  MixerRPM: 0,
  MixerCurrent: 1,
  AlcoholFlowmeter: 1,
  ProcessLevel: 0,
});

const LIMITS = Object.freeze({
  Temperature: { min: -350, max: 350 },
  SetTemperature: { min: -350, max: 350 },
  ColumnTemperature: { min: -350, max: 350 },
  ColumnSetTemperature: { min: -350, max: 350 },
  HeatExchangerOutTemperature: { min: -350, max: 350 },
  HotOilInletTemperature: { min: -350, max: 350 },
  HotOilOutletTemperature: { min: -350, max: 350 },
  Cooling3WayValveRatio: { min: -100, max: 100 },
  Heating3WayValveRatio: { min: -100, max: 100 },
  VacuumPumpMaxRatio: { min: -100, max: 100 },
  Pressure: { min: -5, max: 5 },
  HotOilFlowmeter: { min: -200, max: 200 },
  HotOilFrequence: { min: -60, max: 60 },
  TransferPumpRPM: { min: -5_000, max: 5_000 },
  TransferPumpCurrent: { min: -500, max: 500 },
  MixerRPM: { min: -100, max: 100 },
  MixerCurrent: { min: -500, max: 500 },
  AlcoholFlowmeter: { min: -20_000, max: 20_000 },
  ProcessLevel: { min: -15, max: 15 },
});

/** ---------- Model Factory ---------- **/

export default function makeReactor1DataModel(plcConn) {
  const reactor1DataSchema = new mongoose.Schema(
    {
      DataTime: { type: Date, required: true, index: true },

      // --- Sayısal alanlar ---
      Temperature: { type: Number },
      SetTemperature: { type: Number },
      ColumnTemperature: { type: Number },
      ColumnSetTemperature: { type: Number },
      HeatExchangerOutTemperature: { type: Number },
      Pressure: { type: Number },
      HotOilInletTemperature: { type: Number },
      HotOilOutletTemperature: { type: Number },
      HotOilFlowmeter: { type: Number },
      HotOilFrequence: { type: Number },
      TransferPumpRPM: { type: Number },
      TransferPumpCurrent: { type: Number },
      MixerRPM: { type: Number },
      MixerCurrent: { type: Number },
      Cooling3WayValveRatio: { type: Number },
      Heating3WayValveRatio: { type: Number },
      VacuumPumpMaxRatio: { type: Number },
      AlcoholFlowmeter: { type: Number },

      // --- 0/1/2 enum alanlar ---
      ColorHeating: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorMixer: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorVacuum: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorHotOilPump: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorColumnCoolingPump: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorFirstSeperator: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorSecondSeperator: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorAlcoholValve: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorTransferPump: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorFault: { type: Number, set: allowedEnum([0, 1, 2]) },
      ProcessLevel: { type: Number },
    },
    {
      collection: "reactor1Data",
      timestamps: false,
      versionKey: false,
      strict: true,
      minimize: true,
    }
  );

  // Sorgu senaryosu için ek index (opsiyonel ama faydalı)
  reactor1DataSchema.index({ DataTime: -1 });

  // 1) numeric setter’lar
  Object.entries(PRECISION).forEach(([path, places]) => {
    const lim = LIMITS[path] || {};
    if (reactor1DataSchema.path(path)) {
      reactor1DataSchema.path(path).set(sanitizeRound(places, lim.min, lim.max));
    }
  });

  // 2) pre-save fallback — invalid (undefined) gelen her alanı bir önceki kayıtla doldur
  reactor1DataSchema.pre("save", async function (next) {
    // yalnızca yeni kayıt için
    if (!this.isNew) return next();

    // Son kaydı çek
    const last = await this.constructor.findOne({}, { _id: 0 }).sort({ DataTime: -1 }).lean();

    if (last) {
      // Şemadaki yollar (id ve DataTime hariç)
      const paths = Object.keys(reactor1DataSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");

      for (const p of paths) {
        // Bu kayıtta alan yoksa (undefined/null) → geçen değerle doldur
        // Not: setter’lar invalid değerleri zaten undefined yapıyor.
        if (this[p] == null && last[p] != null) {
          this[p] = last[p];
        }
      }
    }

    // Son güvenlik: null/undefined kalmışsa (ilk kayıt olabilir) — kayıttan düş
    // Böylece DB’de null/undefined hiç yer almaz.
    Object.keys(this.toObject()).forEach((k) => {
      if (this[k] == null) {
        delete this[k];
      }
    });

    next();
  });

  return plcConn.models.Reactor1Data || plcConn.model("Reactor1Data", reactor1DataSchema, "reactor1Data");
}
