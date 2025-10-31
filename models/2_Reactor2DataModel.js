// models/2_Reactor2DataModel.js
import mongoose from "mongoose";

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

const sanitizeRound = (places, min, max) => (v) => {
  const inRange = clampToRangeOrDrop(v, min, max);
  if (inRange == null) return undefined; // invalid → let pre-save fallback handle
  const f = 10 ** places;
  return Math.round(inRange * f) / f;
};

const allowedEnum = (vals) => (v) => {
  if (v == null || v === "") return undefined; // invalid → fallback
  const n = toNumberOrNaN(v);
  return vals.includes(n) ? n : undefined;
};

/** ---------- Precision & Limits ---------- **/
const PRECISION = {
  Temperature: 1,
  SetTemperature: 1,
  ColumnTemperature: 1,
  ColumnSetTemperature: 1,
  HeatExchangerOutTemperature: 1,
  Pressure: 2,
  HotOilInletTemperature: 1,
  HotOilOutletTemperature: 1,
  HotOilFlowmeter: 0,
  HotOilFrequence: 0,
  TransferPumpRPM: 0,
  TransferPumpCurrent: 1,
  MixerRPM: 0,
  MixerCurrent: 1,
  Cooling3WayValveRatio: 0,
  Heating3WayValveRatio: 0,
  VacuumPumpMaxRatio: 0,
  AlcoholFlowmeter: 0,
  ProcessLevel: 0,
};

const LIMITS = {
  Temperature: { min: -350, max: 350 },
  SetTemperature: { min: -350, max: 350 },
  ColumnTemperature: { min: -350, max: 350 },
  ColumnSetTemperature: { min: -350, max: 350 },
  HeatExchangerOutTemperature: { min: -350, max: 350 },
  Pressure: { min: -5, max: 5 },
  HotOilInletTemperature: { min: -350, max: 350 },
  HotOilOutletTemperature: { min: -350, max: 350 },
  HotOilFlowmeter: { min: -200, max: 200 },
  HotOilFrequence: { min: -60, max: 60 },
  TransferPumpRPM: { min: -5_000, max: 5_000 },
  TransferPumpCurrent: { min: -500, max: 500 },
  MixerRPM: { min: -100, max: 100 },
  MixerCurrent: { min: -500, max: 500 },
  Cooling3WayValveRatio: { min: -100, max: 100 },
  Heating3WayValveRatio: { min: -100, max: 100 },
  VacuumPumpMaxRatio: { min: -100, max: 100 },
  AlcoholFlowmeter: { min: -20_000, max: 20_000 },
  ProcessLevel: { min: -15, max: 15 },
};

/** ---------- Factory ---------- **/
export default function makeReactor2DataModel(plcConn) {
  const reactor2DataSchema = new mongoose.Schema(
    {
      DataTime: { type: Date, required: true, index: true },
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

      ColorMixer: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorHeating: { type: Number, set: allowedEnum([0, 1, 2]) },
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
      collection: "reactor2Data",
      timestamps: false,
      versionKey: false,
      strict: true,
      minimize: true,
    }
  );

  reactor2DataSchema.index({ DataTime: -1 });

  Object.entries(PRECISION).forEach(([path, places]) => {
    const limits = LIMITS[path] || {};
    if (reactor2DataSchema.path(path)) {
      reactor2DataSchema.path(path).set(sanitizeRound(places, limits.min, limits.max));
    }
  });

  reactor2DataSchema.pre("save", async function (next) {
    if (!this.isNew) return next();

    const last = await this.constructor.findOne({}, { _id: 0 }).sort({ DataTime: -1 }).lean();

    if (last) {
      const paths = Object.keys(reactor2DataSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");
      for (const p of paths) {
        if (this[p] == null && last[p] != null) this[p] = last[p];
      }
    }

    // Remove any null/undefined before write (first row scenario)
    Object.keys(this.toObject()).forEach((k) => {
      if (this[k] == null) delete this[k];
    });

    next();
  });

  return plcConn.models.Reactor2Data || plcConn.model("Reactor2Data", reactor2DataSchema, "reactor2Data");
}
