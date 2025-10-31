//database/sync.js
import mongoose from "mongoose";

import Reactor1Factory from "../models/1_Reactor1DataModel.js";
import Reactor2Factory from "../models/2_Reactor2DataModel.js";
import Reactor3Factory from "../models/3_Reactor3DataModel.js";
import Reactor4Factory from "../models/4_Reactor4DataModel.js";
import Reactor5Factory from "../models/5_Reactor5DataModel.js";
import Reactor6Factory from "../models/6_Reactor6DataModel.js";
import Reactor7Factory from "../models/7_Reactor7DataModel.js";
import Reactor8Factory from "../models/8_Reactor8DataModel.js";
import FilterPressFactory from "../models/9_FilterPressDataModel.js";
import Scrubber1Factory from "../models/10_Scrubber1DataModel.js";
import Scrubber2Factory from "../models/11_Scrubber2DataModel.js";
import TankFarmFactory from "../models/12_TankFarmDataModel.js";
import AuxiliaryFacilitiesFactory from "../models/13_AuxiliaryFacilitiesDataModel.js";
import NaturalGasFactory from "../models/14_NaturalGasCounterDataModel.js";
import ElectricFactory from "../models/15_ElectricCounterDataModel.js";
import WaterFactory from "../models/16_WaterCounterDataModel.js";

// Factory veya doğrudan model gelebilir; ikisini de destekle
function ensureModel(item) {
  // factory ise (function) çağır: mongoose’ı "plcConn" gibi kullanıyoruz
  if (typeof item === "function") {
    return item(mongoose);
  }
  // zaten model ise direkt dön
  return item;
}

export async function dbsync() {
  try {
    const items = [
      Reactor1Factory,
      Reactor2Factory,
      Reactor3Factory,
      Reactor4Factory,
      Reactor5Factory,
      Reactor6Factory,
      Reactor7Factory,
      Reactor8Factory,
      FilterPressFactory,
      Scrubber1Factory,
      Scrubber2Factory,
      TankFarmFactory,
      AuxiliaryFacilitiesFactory,
      NaturalGasFactory,
      ElectricFactory,
      WaterFactory,
    ];

    const loaded = [];
    for (const it of items) {
      const model = ensureModel(it);
      if (model?.modelName) {
        loaded.push(model.modelName);
      } else {
        console.warn("Model yüklenemedi (factory mi hatalı?):", it?.name || "(anon)");
      }
    }

    console.log(loaded.length ? `Tüm modeller başarıyla yüklendi: ${loaded.join(", ")}` : "Hiç model yüklenemedi!");
  } catch (error) {
    console.error("MongoDB modelleri yüklenirken hata oluştu:", error);
  }
}
