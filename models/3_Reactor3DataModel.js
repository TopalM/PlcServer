import mongoose from "mongoose";
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
  const r = clampToRangeOrDrop(v, min, max);
  if (r == null) return undefined;
  const f = 10 ** places;
  return Math.round(r * f) / f;
};
const allowedEnum = (vals) => (v) => {
  if (v == null || v === "") return undefined;
  const n = toNumberOrNaN(v);
  return vals.includes(n) ? n : undefined;
};
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
  TransferPumpRPM: { min: -5000, max: 5000 },
  TransferPumpCurrent: { min: -500, max: 500 },
  MixerRPM: { min: -100, max: 100 },
  MixerCurrent: { min: -500, max: 500 },
  Cooling3WayValveRatio: { min: -100, max: 100 },
  Heating3WayValveRatio: { min: -100, max: 100 },
  VacuumPumpMaxRatio: { min: -100, max: 100 },
  AlcoholFlowmeter: { min: -20000, max: 20000 },
  ProcessLevel: { min: -15, max: 15 },
};

export default function makeReactor3DataModel(plcConn) {
  const reactor3DataSchema = new mongoose.Schema(
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
      ColorFirstSeperator: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorSecondSeperator: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorAlcoholValve: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorTransferPump: { type: Number, set: allowedEnum([0, 1, 2]) },
      ColorFault: { type: Number, set: allowedEnum([0, 1, 2]) },
      ProcessLevel: { type: Number },
    },
    { collection: "reactor3Data", timestamps: false, versionKey: false, strict: true, minimize: true }
  );

  // Ek index yok.

  Object.entries(PRECISION).forEach(([p, places]) => {
    const lim = LIMITS[p] || {};
    if (reactor3DataSchema.path(p)) {
      reactor3DataSchema.path(p).set(sanitizeRound(places, lim.min, lim.max));
    }
  });

  reactor3DataSchema.pre("save", async function (next) {
    if (!this.isNew) return next();
    const last = await this.constructor.findOne({}, { _id: 0 }).sort({ DataTime: -1 }).lean();
    if (last) {
      const paths = Object.keys(reactor3DataSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");
      for (const p of paths) {
        if (this[p] == null && last[p] != null) this[p] = last[p];
      }
    }
    Object.keys(this.toObject()).forEach((k) => {
      if (this[k] == null) delete this[k];
    });
    next();
  });

  return plcConn.models.Reactor3Data || plcConn.model("Reactor3Data", reactor3DataSchema, "reactor3Data");
}
