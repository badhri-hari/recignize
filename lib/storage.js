import * as FileSystem from "expo-file-system";

export const DATA_DIR = FileSystem.documentDirectory + "data/";
export const ITEMS_FILE = DATA_DIR + "items.json";

export const ensureDataDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(DATA_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DATA_DIR, { intermediates: true });
  }
};

export const savePhotoToDataFolder = async (localUri) => {
  await ensureDataDirectoryExists();
  const filename = `scan_${Date.now()}.jpg`;
  const destinationUri = DATA_DIR + filename;

  await FileSystem.copyAsync({ from: localUri, to: destinationUri });
  return destinationUri;
};

export const saveItemsMetadata = async (items) => {
  await ensureDataDirectoryExists();
  await FileSystem.writeAsStringAsync(ITEMS_FILE, JSON.stringify(items));
};

export const loadItemsMetadata = async () => {
  try {
    const info = await FileSystem.getInfoAsync(ITEMS_FILE);
    if (!info.exists) return [];
    const content = await FileSystem.readAsStringAsync(ITEMS_FILE);
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to load items:", e);
    return [];
  }
};
