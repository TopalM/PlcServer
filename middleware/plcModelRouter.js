// middlewares/plcModelRouter.js
import mongoose from "mongoose";

/**
 * WS kaynak adını Mongoose modeline eşler.
 */
export function modelFor(plcName) {
  const m = mongoose.models;

  const map = {
    PLC_TankFarm: m.TankFarmData,
    PLC_AuxiliaryFacilities: m.AuxiliaryFacilitiesData,
    PLC_NaturalGas: m.NaturalGasCounterData,
    PLC_Electric: m.ElectricCounterData,
    PLC_Water: m.WaterCounterData,
    PLC_Scrubber1: m.Scrubber1Data,
    PLC_Scrubber2: m.Scrubber2Data,
    PLC_FilterPress: m.FilterPressData,
    PLC_1: m.Reactor1Data,
    PLC_2: m.Reactor2Data,
    PLC_3: m.Reactor3Data,
    PLC_4: m.Reactor4Data,
    PLC_5: m.Reactor5Data,
    PLC_6: m.Reactor6Data,
    PLC_7: m.Reactor7Data,
    PLC_8: m.Reactor8Data,
  };

  return map[plcName];
}
