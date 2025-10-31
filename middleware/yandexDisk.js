// middleware/yandexDisk.js
import axios from "axios";
import fs from "fs";

export const uploadToYandexDisk = async ({ localFilePath, yandexDiskPath }) => {
  try {
    const yandexToken = process.env.YANDEX_DISK_TOKEN;

    const uploadLinkResponse = await axios.get("https://cloud-api.yandex.net/v1/disk/resources/upload", {
      headers: { Authorization: `OAuth ${yandexToken}` },
      params: { path: yandexDiskPath, overwrite: true },
    });

    const apiUrl = uploadLinkResponse.data.href;
    const fileStream = fs.createReadStream(localFilePath);

    await axios.put(apiUrl, fileStream, { headers: { "Content-Type": "application/octet-stream" } });

    console.log("Dosya Yandex Disk'e başarıyla yüklendi:", yandexDiskPath);
    return { success: true };
  } catch (error) {
    console.error("Yandex Disk Yükleme Hatası:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const deleteFromYandexDisk = async (yandexDiskPath) => {
  try {
    const yandexToken = process.env.YANDEX_DISK_TOKEN;
    await axios.delete("https://cloud-api.yandex.net/v1/disk/resources", {
      headers: { Authorization: `OAuth ${yandexToken}` },
      params: { path: yandexDiskPath },
    });
    console.log("Dosya Yandex Disk'ten başarıyla silindi:", yandexDiskPath);
    return { success: true };
  } catch (error) {
    console.error("Yandex Disk'ten dosya silme hatası:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const downloadFromYandexDisk = async (yandexDiskPath, localFilePath) => {
  try {
    const yandexToken = process.env.YANDEX_DISK_TOKEN;

    const downloadLinkResponse = await axios.get("https://cloud-api.yandex.net/v1/disk/resources/download", {
      headers: { Authorization: `OAuth ${yandexToken}` },
      params: { path: yandexDiskPath },
    });

    const downloadUrl = downloadLinkResponse.data.href;
    const response = await axios.get(downloadUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(localFilePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log("Dosya başarıyla indirildi:", localFilePath);
        setTimeout(() => {
          if (fs.existsSync(localFilePath)) {
            fs.unlink(localFilePath, (err) => {
              if (err) console.error("Dosya silinirken hata oluştu:", err);
              else console.log("Dosya başarıyla silindi:", localFilePath);
            });
          }
        }, 60000);
        resolve();
      });
      writer.on("error", (err) => {
        console.error("Dosya indirilirken hata oluştu:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Yandex Disk'ten dosya indirme hatası:", error.message);
    throw new Error("Dosya indirilemedi.");
  }
};

export const moveFileOnYandexDisk = async ({ currentPath, newPath }) => {
  try {
    const yandexToken = process.env.YANDEX_DISK_TOKEN;
    if (!yandexToken) throw new Error("Yandex Disk token tanımlı değil.");

    await axios.post("https://cloud-api.yandex.net/v1/disk/resources/move", null, {
      headers: { Authorization: `OAuth ${yandexToken}` },
      params: { from: currentPath, path: newPath, overwrite: true },
    });

    console.log("Dosya Yandex Disk'te başarıyla taşındı:", newPath);
    return { success: true };
  } catch (error) {
    console.error("Yandex Disk dosya taşıma hatası:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const streamYandexImageController = async (req, res) => {
  const yandexToken = process.env.YANDEX_DISK_TOKEN;
  const yandexPath = req.query.path;

  if (!yandexPath) return res.status(400).json({ success: false, message: "Path gerekli." });

  try {
    const downloadLinkResponse = await axios.get("https://cloud-api.yandex.net/v1/disk/resources/download", {
      headers: { Authorization: `OAuth ${yandexToken}` },
      params: { path: yandexPath },
    });

    const downloadUrl = downloadLinkResponse.data.href;
    const imageResponse = await axios.get(downloadUrl, { responseType: "stream" });

    res.setHeader("Content-Type", "image/jpeg");
    imageResponse.data.pipe(res);
  } catch (error) {
    console.error("Resim akış hatası:", error?.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Resim alınamadı." });
  }
};

export const checkIfFileExistsOnYandex = async (yandexDiskPath) => {
  try {
    const yandexToken = process.env.YANDEX_DISK_TOKEN;

    const response = await axios.get("https://cloud-api.yandex.net/v1/disk/resources", {
      headers: { Authorization: `OAuth ${yandexToken}` },
      params: { path: yandexDiskPath },
    });

    return response.status === 200;
  } catch (error) {
    if (error.response?.status === 404) return false;
    console.error("Yandex Disk dosya kontrol hatası:", error.message);
    return false;
  }
};

export const createFolderOnYandex = async ({ yandexDiskPath }) => {
  const yandexToken = process.env.YANDEX_DISK_TOKEN;
  if (!yandexToken) throw new Error("YANDEX_DISK_TOKEN tanımlı değil.");

  const toDiskPath = (p) => (p?.startsWith("disk:") ? p : `disk:${p?.startsWith("/") ? "" : "/"}${p}`);
  const parentOf = (p) => {
    const noDisk = p.replace(/^disk:/, "");
    const parts = noDisk.split("/").filter(Boolean);
    parts.pop();
    return `disk:/${parts.join("/")}`;
  };

  const pathParam = toDiskPath(yandexDiskPath);

  try {
    await axios.put("https://cloud-api.yandex.net/v1/disk/resources", null, {
      params: { path: pathParam },
      headers: { Authorization: `OAuth ${yandexToken}` },
    });
    return { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const code = error?.response?.data?.error;

    if (status === 409 && (code === "PathExistsError" || code === "DiskPathPointsToExistentDirectoryError")) {
      return { success: true, alreadyExists: true };
    }

    if (status === 409 && code === "DiskPathDoesntExistsError") {
      const parent = parentOf(pathParam);
      if (parent !== "disk:/") {
        const mkParent = await createFolderOnYandex({ yandexDiskPath: parent });
        if (mkParent.success) {
          try {
            await axios.put("https://cloud-api.yandex.net/v1/disk/resources", null, {
              params: { path: pathParam },
              headers: { Authorization: `OAuth ${yandexToken}` },
            });
            return { success: true };
          } catch (e2) {
            const s2 = e2?.response?.status;
            const c2 = e2?.response?.data?.error;
            if (s2 === 409 && (c2 === "PathExistsError" || c2 === "DiskPathPointsToExistentDirectoryError")) {
              return { success: true, alreadyExists: true };
            }
            return { success: false, error: e2?.response?.data || e2.message };
          }
        }
        return { success: false, error: mkParent.error };
      }
    }

    console.error("Yandex klasör oluşturma hatası:", error?.response?.data || error.message);
    return { success: false, error: error?.response?.data || error.message };
  }
};
