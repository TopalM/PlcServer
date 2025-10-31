// models/13_AuxiliaryFacilitiesDataModel.js
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
  if (v == null || (typeof v === "string" && v.trim() === "")) return undefined;
  const n = toNumberOrNaN(v);
  return vals.includes(n) ? n : undefined;
};

/** ---------- Precision ---------- **/
const PRECISION = {
  Ham_Su_Havuz_Seviyesi: 0,
  Kullanma_Suyu_Havuz_Seviyesi: 0,
  Yangin_Suyu_Havuz_Seviyesi: 0,
  Proses_Suyu_Havuz_Seviyesi: 0,

  Hava_Basinci: 1,
  Azot_Basinci: 1,

  Reaktor_1_2_3_4_Su_Gidis_Basinci: 2,
  Reaktor_1_2_3_4_Su_Gidis_Sicakligi: 1,
  Reaktor_1_2_3_4_Su_Donus_Sicakligi: 1,
  Reaktor_5_6_7_8_Su_Gidis_Basinci: 2,
  Reaktor_5_6_7_8_Su_Gidis_Sicakligi: 1,
  Reaktor_5_6_7_8_Su_Donus_Sicakligi: 1,

  OMP_8000_Gelis_Sicakligi: 1,
  OMP_8000_Donus_Sicakligi: 1,
  OMP_10000_Gelis_Sicakligi: 1,
  OMP_10000_Donus_Sicakligi: 1,

  Dis_Hava_Sicakligi: 1,
  Dis_Hava_Bagil_Nem: 1,
  Dis_Hava_Yas_Termometre_Sicakligi: 1,

  Chiller_Su_Basinci: 2,
  Chiller_Su_Gidis_Sicakligi: 1,
  Chiller_Su_Donus_Sicakligi: 1,

  Cooling_Tower_1_Input_Temperature: 1,
  Cooling_Tower_1_Output_Temperature: 1,
  Cooling_Tower_2_Input_Temperature: 1,
  Cooling_Tower_2_Output_Temperature: 1,
  Cooling_Tower_3_Input_Temperature: 1,
  Cooling_Tower_3_Output_Temperature: 1,
  Cooling_Tower_4_Input_Temperature: 1,
  Cooling_Tower_4_Output_Temperature: 1,
  Cooling_Tower_5_Input_Temperature: 1,
  Cooling_Tower_5_Output_Temperature: 1,

  // Sıcak yağ basınçları
  Kizgin_Yag_R1357_Inlet_Pressure: 2,
  Kizgin_Yag_R1357_Outlet_Pressure: 2,
  Kizgin_Yag_R2468_Inlet_Pressure: 2,
  Kizgin_Yag_R2468_Outlet_Pressure: 2,
};

/** ---------- Limits ---------- **/
const LIMITS = {
  Ham_Su_Havuz_Seviyesi: { min: -100, max: 100 },
  Kullanma_Suyu_Havuz_Seviyesi: { min: -100, max: 100 },
  Yangin_Suyu_Havuz_Seviyesi: { min: -100, max: 100 },
  Proses_Suyu_Havuz_Seviyesi: { min: -100, max: 100 },

  Hava_Basinci: { min: -10, max: 10 },
  Azot_Basinci: { min: -10, max: 10 },

  Reaktor_1_2_3_4_Su_Gidis_Basinci: { min: -10, max: 10 },
  Reaktor_5_6_7_8_Su_Gidis_Basinci: { min: -10, max: 10 },
  Reaktor_1_2_3_4_Su_Gidis_Sicakligi: { min: -120, max: 120 },
  Reaktor_1_2_3_4_Su_Donus_Sicakligi: { min: -120, max: 120 },
  Reaktor_5_6_7_8_Su_Gidis_Sicakligi: { min: -120, max: 120 },
  Reaktor_5_6_7_8_Su_Donus_Sicakligi: { min: -120, max: 120 },

  OMP_8000_Gelis_Sicakligi: { min: -350, max: 350 },
  OMP_8000_Donus_Sicakligi: { min: -350, max: 350 },
  OMP_10000_Gelis_Sicakligi: { min: -350, max: 350 },
  OMP_10000_Donus_Sicakligi: { min: -350, max: 350 },

  Dis_Hava_Sicakligi: { min: -60, max: 60 },
  Dis_Hava_Bagil_Nem: { min: -100, max: 100 },
  Dis_Hava_Yas_Termometre_Sicakligi: { min: -100, max: 100 },

  Chiller_Su_Basinci: { min: -10, max: 10 },
  Chiller_Su_Gidis_Sicakligi: { min: -100, max: 100 },
  Chiller_Su_Donus_Sicakligi: { min: -100, max: 100 },

  Cooling_Tower_1_Input_Temperature: { min: -100, max: 100 },
  Cooling_Tower_1_Output_Temperature: { min: -100, max: 100 },
  Cooling_Tower_2_Input_Temperature: { min: -100, max: 100 },
  Cooling_Tower_2_Output_Temperature: { min: -100, max: 100 },
  Cooling_Tower_3_Input_Temperature: { min: -100, max: 100 },
  Cooling_Tower_3_Output_Temperature: { min: -100, max: 100 },
  Cooling_Tower_4_Input_Temperature: { min: -100, max: 100 },
  Cooling_Tower_4_Output_Temperature: { min: -100, max: 100 },
  Cooling_Tower_5_Input_Temperature: { min: -100, max: 100 },
  Cooling_Tower_5_Output_Temperature: { min: -100, max: 100 },

  Kizgin_Yag_R1357_Inlet_Pressure: { min: -10, max: 10 },
  Kizgin_Yag_R1357_Outlet_Pressure: { min: -10, max: 10 },
  Kizgin_Yag_R2468_Inlet_Pressure: { min: -10, max: 10 },
  Kizgin_Yag_R2468_Outlet_Pressure: { min: -10, max: 10 },
};

export default function makeAuxiliaryFacilitiesDataModel(plcConn) {
  const auxiliaryFacilitiesDataSchema = new mongoose.Schema(
    {
      DataTime: { type: Date, required: true, index: true },

      Elektrikli_Pompa: { type: Number, set: allowedEnum([0, 1, 2]) },
      Dizel_1_Pompa: { type: Number, set: allowedEnum([0, 1, 2]) },
      Dizel_2_Pompa: { type: Number, set: allowedEnum([0, 1, 2]) },

      Ham_Su_Havuz_Seviyesi: { type: Number },
      Kullanma_Suyu_Havuz_Seviyesi: { type: Number },
      Yangin_Suyu_Havuz_Seviyesi: { type: Number },
      Proses_Suyu_Havuz_Seviyesi: { type: Number },

      Ham_Su_Havuz_Vanasi: { type: Number, set: allowedEnum([0, 1, 2]) },
      Kullanma_Suyu_Havuz_Vanasi: { type: Number, set: allowedEnum([0, 1, 2]) },
      Yangin_Suyu_Havuz_Vanasi: { type: Number, set: allowedEnum([0, 1, 2]) },
      Proses_Suyu_Havuz_Vanasi: { type: Number, set: allowedEnum([0, 1, 2]) },
      Pool_Fan: { type: Number, set: allowedEnum([0, 1, 2]) },

      Hava_Basinci: { type: Number },
      Azot_Basinci: { type: Number },

      Sogutma_Kulesi_1_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
      Sogutma_Kulesi_2_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
      Sogutma_Kulesi_3_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
      Sogutma_Kulesi_4_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
      Sogutma_Kulesi_5_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },

      Plastifiyan_Sogutma_Pompasi_1_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
      Plastifiyan_Sogutma_Pompasi_2_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
      Plastifiyan_Sogutma_Pompasi_3_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
      Stabilizan_Sogutma_Pompasi_1_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
      Stabilizan_Sogutma_Pompasi_2_Calis_Dur_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },

      Reaktor_1_2_3_4_Su_Gidis_Basinci: { type: Number },
      Reaktor_1_2_3_4_Su_Gidis_Sicakligi: { type: Number },
      Reaktor_1_2_3_4_Su_Donus_Sicakligi: { type: Number },
      Reaktor_5_6_7_8_Su_Gidis_Basinci: { type: Number },
      Reaktor_5_6_7_8_Su_Gidis_Sicakligi: { type: Number },
      Reaktor_5_6_7_8_Su_Donus_Sicakligi: { type: Number },

      OMP_8000_Gelis_Sicakligi: { type: Number },
      OMP_8000_Donus_Sicakligi: { type: Number },
      OMP_10000_Gelis_Sicakligi: { type: Number },
      OMP_10000_Donus_Sicakligi: { type: Number },
      Bono_Kazan_Calisiyor_Duruyor_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },

      Dis_Hava_Sicakligi: { type: Number },
      Dis_Hava_Bagil_Nem: { type: Number },
      Dis_Hava_Yas_Termometre_Sicakligi: { type: Number },

      Chiller_Su_Basinci: { type: Number },
      Chiller_Su_Gidis_Sicakligi: { type: Number },
      Chiller_Su_Donus_Sicakligi: { type: Number },
      Chiller_Calisiyor_Duruyor_Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },

      Cooling_Tower_1_Input_Temperature: { type: Number },
      Cooling_Tower_1_Output_Temperature: { type: Number },
      Cooling_Tower_2_Input_Temperature: { type: Number },
      Cooling_Tower_2_Output_Temperature: { type: Number },
      Cooling_Tower_3_Input_Temperature: { type: Number },
      Cooling_Tower_3_Output_Temperature: { type: Number },
      Cooling_Tower_4_Input_Temperature: { type: Number },
      Cooling_Tower_4_Output_Temperature: { type: Number },
      Cooling_Tower_5_Input_Temperature: { type: Number },
      Cooling_Tower_5_Output_Temperature: { type: Number },

      Kizgin_Yag_R1357_Inlet_Pressure: { type: Number },
      Kizgin_Yag_R1357_Outlet_Pressure: { type: Number },
      Kizgin_Yag_R2468_Inlet_Pressure: { type: Number },
      Kizgin_Yag_R2468_Outlet_Pressure: { type: Number },
    },
    {
      collection: "auxiliaryFacilitiesData",
      timestamps: false,
      versionKey: false,
      strict: true,
      minimize: true,
    }
  );

  // precision + limit setterları
  Object.entries(PRECISION).forEach(([path, places]) => {
    const lim = LIMITS[path] || {};
    if (auxiliaryFacilitiesDataSchema.path(path)) {
      auxiliaryFacilitiesDataSchema.path(path).set(sanitizeRound(places, lim.min, lim.max));
    }
  });

  auxiliaryFacilitiesDataSchema.pre("save", async function (next) {
    if (!this.isNew) return next();
    const last = await this.constructor.findOne().sort({ DataTime: -1 }).lean();
    if (last) {
      const paths = Object.keys(auxiliaryFacilitiesDataSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");
      for (const p of paths) if (this[p] == null && last[p] != null) this[p] = last[p];
    }
    Object.keys(this.toObject()).forEach((k) => {
      if (this[k] == null) delete this[k];
    });
    next();
  });

  return plcConn.models.AuxiliaryFacilitiesData || plcConn.model("AuxiliaryFacilitiesData", auxiliaryFacilitiesDataSchema, "auxiliaryFacilitiesData");
}
