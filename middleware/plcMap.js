// middlewares/plcMap.js

import mongoose from "mongoose";

export const plcModelMap = {
  // PLC isimlerine göre
  PLC_Reactor1: mongoose.models.Reactor1Data,
  PLC_Reactor2: mongoose.models.Reactor2Data,
  PLC_Reactor3: mongoose.models.Reactor3Data,
  PLC_Reactor4: mongoose.models.Reactor4Data,
  PLC_Reactor5: mongoose.models.Reactor5Data,
  PLC_Reactor6: mongoose.models.Reactor6Data,
  PLC_Reactor7: mongoose.models.Reactor7Data,
  PLC_Reactor8: mongoose.models.Reactor8Data,

  PLC_Scrubber1: mongoose.models.Scrubber1Data,
  PLC_Scrubber2: mongoose.models.Scrubber2Data,
  PLC_FilterPress: mongoose.models.FilterPressData,
  PLC_TankFarm: mongoose.models.TankFarmData,
  PLC_AuxiliaryFacilities: mongoose.models.AuxiliaryFacilitiesData,
  PLC_NaturalGasCounter: mongoose.models.NaturalGasCounterData,
  PLC_ElectricCounter: mongoose.models.ElectricCounterData,
  PLC_WaterCounter: mongoose.models.WaterCounterData,
};
