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
