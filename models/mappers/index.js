// models/mappers/index.js

const toNum = (v) => (typeof v === "boolean" ? (v ? 1 : 0) : v ?? null);
const boolTo01 = (v) => (v === true ? 1 : v === false ? 0 : v);

/** TankFarm: bazı vana/priz alanları boolean geliyor → 0/1'e çevir */
export function mapTankFarm(payload) {
  const out = { ...payload };
  [
    "Tank_6_Vana_165_Tanker",
    "Tank_13_Vana_165_Tanker",
    "Tank_12_Vana_166_Tanker",
    "Tank_14_Vana_166_Tanker",
    "Tank_19_Vana_166_Tanker",
    "Tank_5_Vana_160_Tanker",
    "Tank_20_Vana_164_Tanker",
    "Tank_21_Vana_164_Tanker",
    "Tank_4_Vana_162_Tanker",
    "Tank_21_Vana_162_Tanker",
    "Alkol_Kuzey_Cephe_Priz_ile",
    "Alkol_Guney_Cephe_Priz_ile",
  ].forEach((k) => {
    if (k in out) out[k] = boolTo01(out[k]);
  });
  return out;
}

/** Scrubber ve FilterPress: veriler zaten numeric; dokunmadan geçiyoruz */
export const mapScrubber = (p) => ({ ...p });
export const mapFilterPress = (p) => ({ ...p });

/** Yardımcı Tesisler, Elektrik, Doğal Gaz, Su: doğrudan geçir */
export const mapAux = (p) => ({ ...p });
export const mapElectric = (p) => ({ ...p });
export const mapGas = (p) => ({ ...p });
export const mapWater = (p) => ({ ...p });

/** Reaktörler: isimler uyumlu; direkt geçir */
export const mapReactor = (p) => ({ ...p });

/**
 * Kaynak adına göre mapper seçer.
 */
export function pickMapper(plcName) {
  if (plcName === "PLC_TankFarm") return mapTankFarm;
  if (plcName === "PLC_Scrubber1" || plcName === "PLC_Scrubber2") return mapScrubber;
  if (plcName === "PLC_FilterPress") return mapFilterPress;
  if (plcName === "PLC_AuxiliaryFacilities") return mapAux;
  if (plcName === "PLC_Electric") return mapElectric;
  if (plcName === "PLC_NaturalGas") return mapGas;
  if (plcName === "PLC_Water") return mapWater;
  // PLC_1..PLC_8
  if (/^PLC_\d+$/.test(plcName)) return mapReactor;
  return (p) => ({ ...p }); // default
}
