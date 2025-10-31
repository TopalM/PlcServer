import mongoose from "mongoose";

const allowedEnum = (vals) => (v) => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && vals.includes(n) ? n : undefined;
};

export default function makeScrubber1DataModel(plcConn) {
  const scrubber1DataSchema = new mongoose.Schema(
    {
      DataTime: { type: Date, required: true, index: true },
      Su_Seviyesi: { type: Number },
      Color3YolluVanaKaristirma: { type: Number, set: allowedEnum([0, 1, 2]) },
      Color3YolluVanaYikama: { type: Number, set: allowedEnum([0, 1, 2]) },
      TemizSuVanasi: { type: Number, set: allowedEnum([0, 1, 2]) },
      BosaltmaVanasi: { type: Number, set: allowedEnum([0, 1, 2]) },
      Fan: { type: Number, set: allowedEnum([0, 1, 2]) },
      SirkulasyonPompasi: { type: Number, set: allowedEnum([0, 1, 2]) },
      TemizlikPompasi: { type: Number, set: allowedEnum([0, 1, 2]) },
      DolumManual: { type: Number, set: allowedEnum([0, 1, 2]) },
      DolumOtomatik: { type: Number, set: allowedEnum([0, 1, 2]) },
      Ariza: { type: Number, set: allowedEnum([0, 1, 2]) },
    },
    { collection: "scrubber1Data", timestamps: false, versionKey: false, strict: true, minimize: true }
  );

  // Ek index yok.

  scrubber1DataSchema.pre("save", async function (next) {
    if (!this.isNew) return next();
    const last = await this.constructor.findOne({}, { _id: 0 }).sort({ DataTime: -1 }).lean();
    if (last) {
      const paths = Object.keys(scrubber1DataSchema.paths).filter((p) => p !== "_id" && p !== "DataTime");
      for (const p of paths) {
        if (this[p] == null && last[p] != null) this[p] = last[p];
      }
    }
    Object.keys(this.toObject()).forEach((k) => {
      if (this[k] == null) delete this[k];
    });
    next();
  });

  return plcConn.models.Scrubber1Data || plcConn.model("Scrubber1Data", scrubber1DataSchema, "scrubber1Data");
}
