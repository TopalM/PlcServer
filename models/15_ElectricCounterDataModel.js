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
const sanitizeRound = (p, min, max) => (v) => {
  const r = clampToRangeOrDrop(v, min, max);
  if (r == null) return undefined;
  const f = 10 ** p;
  return Math.round(r * f) / f;
};
const isFiniteNumber = (v) => Number.isFinite(toNumberOrNaN(v));

const PRECISION = {
  /* mevcut */ Main_Counter_Counter: 0,
  Main_Counter_Enductive: 0,
  Main_Counter_Capasitive: 0,
  Main_Counter_L1: 1,
  Main_Counter_L2: 1,
  Main_Counter_L3: 1,
  Main_Counter_V1: 0,
  Main_Counter_V2: 0,
  Main_Counter_V3: 0,
  Main_Counter_Frequence: 0,
  Main_Counter_Active_Power: 1,
  Cooling_Water_Counter: 0,
  Cooling_Water_Enductive: 0,
  Cooling_Water_Capasitive: 0,
  Cooling_Water_L1: 1,
  Cooling_Water_L2: 1,
  Cooling_Water_L3: 1,
  Cooling_Water_V1: 0,
  Cooling_Water_V2: 0,
  Cooling_Water_V3: 0,
  Cooling_Water_Frequence: 0,
  Cooling_Water_Active_Power: 1,
  Boiler_Room_Counter: 0,
  Boiler_Room_Enductive: 0,
  Boiler_Room_Capasitive: 0,
  Boiler_Room_L1: 1,
  Boiler_Room_L2: 1,
  Boiler_Room_L3: 1,
  Boiler_Room_V1: 0,
  Boiler_Room_V2: 0,
  Boiler_Room_V3: 0,
  Boiler_Room_Frequence: 0,
  Boiler_Room_Active_Power: 1,
  Stabilizan_Counter: 0,
  Stabilizan_Enductive: 0,
  Stabilizan_Capasitive: 0,
  Stabilizan_L1: 1,
  Stabilizan_L2: 1,
  Stabilizan_L3: 1,
  Stabilizan_V1: 0,
  Stabilizan_V2: 0,
  Stabilizan_V3: 0,
  Stabilizan_Frequence: 0,
  Stabilizan_Active_Power: 1,
  Reactor_6_Counter: 0,
  Reactor_6_Enductive: 0,
  Reactor_6_Capasitive: 0,
  Reactor_6_L1: 1,
  Reactor_6_L2: 1,
  Reactor_6_L3: 1,
  Reactor_6_V1: 0,
  Reactor_6_V2: 0,
  Reactor_6_V3: 0,
  Reactor_6_Frequence: 0,
  Reactor_6_Active_Power: 1,
  Reactor_7_Counter: 0,
  Reactor_7_Enductive: 0,
  Reactor_7_Capasitive: 0,
  Reactor_7_L1: 1,
  Reactor_7_L2: 1,
  Reactor_7_L3: 1,
  Reactor_7_V1: 0,
  Reactor_7_V2: 0,
  Reactor_7_V3: 0,
  Reactor_7_Frequence: 0,
  Reactor_7_Active_Power: 1,
  Hot_Oil_Pump_Counter: 0,
  Hot_Oil_Pump_Enductive: 0,
  Hot_Oil_Pump_Capasitive: 0,
  Hot_Oil_Pump_L1: 1,
  Hot_Oil_Pump_L2: 1,
  Hot_Oil_Pump_L3: 1,
  Hot_Oil_Pump_V1: 0,
  Hot_Oil_Pump_V2: 0,
  Hot_Oil_Pump_V3: 0,
  Hot_Oil_Pump_Frequence: 0,
  Hot_Oil_Pump_Active_Power: 1,
  Comfort_Chiller_Counter: 0,
  Comfort_Chiller_Enductive: 0,
  Comfort_Chiller_Capasitive: 0,
  Comfort_Chiller_L1: 1,
  Comfort_Chiller_L2: 1,
  Comfort_Chiller_L3: 1,
  Comfort_Chiller_V1: 0,
  Comfort_Chiller_V2: 0,
  Comfort_Chiller_V3: 0,
  Comfort_Chiller_Frequence: 0,
  Comfort_Chiller_Active_Power: 1,
  Filter_Press_Counter: 0,
  Filter_Press_Enductive: 0,
  Filter_Press_Capasitive: 0,
  Filter_Press_L1: 1,
  Filter_Press_L2: 1,
  Filter_Press_L3: 1,
  Filter_Press_V1: 0,
  Filter_Press_V2: 0,
  Filter_Press_V3: 0,
  Filter_Press_Frequence: 0,
  Filter_Press_Active_Power: 1,
  Scrubber_1_Counter: 0,
  Scrubber_1_Enductive: 0,
  Scrubber_1_Capasitive: 0,
  Scrubber_1_L1: 1,
  Scrubber_1_L2: 1,
  Scrubber_1_L3: 1,
  Scrubber_1_V1: 0,
  Scrubber_1_V2: 0,
  Scrubber_1_V3: 0,
  Scrubber_1_Frequence: 0,
  Scrubber_1_Active_Power: 1,
  Scrubber_2_Counter: 0,
  Scrubber_2_Enductive: 0,
  Scrubber_2_Capasitive: 0,
  Scrubber_2_L1: 1,
  Scrubber_2_L2: 1,
  Scrubber_2_L3: 1,
  Scrubber_2_V1: 0,
  Scrubber_2_V2: 0,
  Scrubber_2_V3: 0,
  Scrubber_2_Frequence: 0,
  Scrubber_2_Active_Power: 1,
  Tank_Farm_Counter: 0,
  Tank_Farm_Enductive: 0,
  Tank_Farm_Capasitive: 0,
  Tank_Farm_L1: 1,
  Tank_Farm_L2: 1,
  Tank_Farm_L3: 1,
  Tank_Farm_V1: 0,
  Tank_Farm_V2: 0,
  Tank_Farm_V3: 0,
  Tank_Farm_Frequence: 0,
  Tank_Farm_Active_Power: 1,
  Production_Chiller_Counter: 0,
  Production_Chiller_Enductive: 0,
  Production_Chiller_Capasitive: 0,
  Production_Chiller_L1: 1,
  Production_Chiller_L2: 1,
  Production_Chiller_L3: 1,
  Production_Chiller_V1: 0,
  Production_Chiller_V2: 0,
  Production_Chiller_V3: 0,
  Production_Chiller_Frequence: 0,
  Production_Chiller_Active_Power: 1,
  Treatment_Counter: 0,
  Treatment_Enductive: 0,
  Treatment_Capasitive: 0,
  Treatment_L1: 1,
  Treatment_L2: 1,
  Treatment_L3: 1,
  Treatment_V1: 0,
  Treatment_V2: 0,
  Treatment_V3: 0,
  Treatment_Frequence: 0,
  Treatment_Active_Power: 1,
  Others_Counter: 0,
  Others_Enductive: 0,
  Others_Capasitive: 0,
  Others_L1: 1,
  Others_L2: 1,
  Others_L3: 1,
  Others_V1: 0,
  Others_V2: 0,
  Others_V3: 0,
  Others_Frequence: 0,
  Others_Active_Power: 1,
  Kobe_Main_Counter: 0,
  Kobe_Main_Enductive: 0,
  Kobe_Main_Capasitive: 0,
  Kobe_Main_L1: 1,
  Kobe_Main_L2: 1,
  Kobe_Main_L3: 1,
  Kobe_Main_V1: 0,
  Kobe_Main_V2: 0,
  Kobe_Main_V3: 0,
  Kobe_Main_Frequence: 0,
  Kobe_Main_Active_Power: 1,
  Kobe_Boiler_Room_Counter: 0,
  Kobe_Boiler_Room_Enductive: 0,
  Kobe_Boiler_Room_Capasitive: 0,
  Kobe_Boiler_Room_L1: 1,
  Kobe_Boiler_Room_L2: 1,
  Kobe_Boiler_Room_L3: 1,
  Kobe_Boiler_Room_V1: 0,
  Kobe_Boiler_Room_V2: 0,
  Kobe_Boiler_Room_V3: 0,
  Kobe_Boiler_Room_Frequence: 0,
  Kobe_Boiler_Room_Active_Power: 1,
  Kobe_Fan_Counter: 0,
  Kobe_Fan_Enductive: 0,
  Kobe_Fan_Capasitive: 0,
  Kobe_Fan_L1: 1,
  Kobe_Fan_L2: 1,
  Kobe_Fan_L3: 1,
  Kobe_Fan_V1: 0,
  Kobe_Fan_V2: 0,
  Kobe_Fan_V3: 0,
  Kobe_Fan_Frequence: 0,
  Kobe_Fan_Active_Power: 1,
  Transformator_Temp1: 1,
  Transformator_Temp2: 1,
  Transformator_Temp3: 1,
  Transformator_Temp_Room: 1,
};
const LIMITS = {};
const groups = [
  "Cooling_Water",
  "Boiler_Room",
  "Stabilizan",
  "Reactor_6",
  "Reactor_7",
  "Hot_Oil_Pump",
  "Comfort_Chiller",
  "Filter_Press",
  "Scrubber_1",
  "Scrubber_2",
  "Tank_Farm",
  "Production_Chiller",
  "Treatment",
  "Others",
  "Kobe_Main",
  "Kobe_Boiler_Room",
  "Kobe_Fan",
];
for (const g of groups) {
  LIMITS[`${g}_V1`] = { min: 0, max: 300 };
  LIMITS[`${g}_V2`] = { min: 0, max: 300 };
  LIMITS[`${g}_V3`] = { min: 0, max: 300 };
  LIMITS[`${g}_Frequence`] = { min: 0, max: 60 };
  for (const p of ["L1", "L2", "L3", "Active_Power"]) LIMITS[`${g}_${p}`] = { min: 0, max: 2000 };
  for (const p of ["Counter", "Enductive", "Capasitive"]) LIMITS[`${g}_${p}`] = { min: 0, max: 1e9 };
}
for (const p of ["L1", "L2", "L3", "Active_Power"]) LIMITS[`Main_Counter_${p}`] = { min: 0, max: 2000 };
LIMITS["Main_Counter_V1"] = { min: 0, max: 40000 };
LIMITS["Main_Counter_V2"] = { min: 0, max: 40000 };
LIMITS["Main_Counter_V3"] = { min: 0, max: 40000 };
for (const p of ["Counter", "Enductive", "Capasitive"]) LIMITS[`Main_Counter_${p}`] = { min: 0, max: 1e10 };
LIMITS["Main_Counter_Frequence"] = { min: 0, max: 60 };
LIMITS["Transformator_Temp1"] = { min: -200, max: 200 };
LIMITS["Transformator_Temp2"] = { min: -200, max: 200 };
LIMITS["Transformator_Temp3"] = { min: -200, max: 200 };
LIMITS["Transformator_Temp_Room"] = { min: -200, max: 200 };

export default function makeElectricCounterDataModel(plcConn) {
  const electricCounterSchema = new mongoose.Schema(
    Object.fromEntries(
      [
        "Main_Counter",
        "Cooling_Water",
        "Boiler_Room",
        "Stabilizan",
        "Reactor_6",
        "Reactor_7",
        "Hot_Oil_Pump",
        "Comfort_Chiller",
        "Filter_Press",
        "Scrubber_1",
        "Scrubber_2",
        "Tank_Farm",
        "Production_Chiller",
        "Treatment",
        "Others",
        "Kobe_Main",
        "Kobe_Boiler_Room",
        "Kobe_Fan",
      ]
        .flatMap((group) => [
          [`${group}_Counter`, { type: Number }],
          [`${group}_Enductive`, { type: Number }],
          [`${group}_Capasitive`, { type: Number }],
          [`${group}_L1`, { type: Number }],
          [`${group}_L2`, { type: Number }],
          [`${group}_L3`, { type: Number }],
          [`${group}_V1`, { type: Number }],
          [`${group}_V2`, { type: Number }],
          [`${group}_V3`, { type: Number }],
          [`${group}_Frequence`, { type: Number }],
          [`${group}_Active_Power`, { type: Number }],
        ])
        .concat([
          ["Transformator_Temp1", { type: Number }],
          ["Transformator_Temp2", { type: Number }],
          ["Transformator_Temp3", { type: Number }],
          ["Transformator_Temp_Room", { type: Number }],
          ["DataTime", { type: Date, required: true, index: true }],
        ])
    ),
    { collection: "electricCounterData", timestamps: false, versionKey: false, strict: true, minimize: true }
  );

  Object.entries(PRECISION).forEach(([p, places]) => {
    const lim = LIMITS[p] || {};
    if (electricCounterSchema.path(p)) {
      electricCounterSchema.path(p).set(sanitizeRound(places, lim.min, lim.max));
    }
  });

  const MONOTONIC_FIELDS = Object.keys(PRECISION).filter((k) => k.endsWith("_Counter") || k.endsWith("_Enductive") || k.endsWith("_Capasitive"));

  electricCounterSchema.pre("save", async function (next) {
    if (!this.isNew) return next();
    const last = await this.constructor.findOne().sort({ DataTime: -1 }).lean();
    if (last) {
      const paths = Object.keys(electricCounterSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");
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

  return plcConn.models.ElectricCounterData || plcConn.model("ElectricCounterData", electricCounterSchema, "electricCounterData");
}
