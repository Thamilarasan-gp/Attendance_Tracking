import { Alert } from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  if (typeof btoa === "function") return btoa(binary);
  if (typeof Buffer !== "undefined") return Buffer.from(binary, "binary").toString("base64");
  throw new Error("No base64 encoder available");
};

export const downloadExcel = async (apiUrl, password, fileName) => {
  try {
    // Use Expo cache directory
    const cacheDir = FileSystem.cacheDirectory;
    const filePath = `${cacheDir}${fileName}`;

    // Fetch file from backend (POST with JSON body)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to download`);
    }

    // Convert response to arrayBuffer and then to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = arrayBufferToBase64(arrayBuffer);

    // Write file to cache as base64
    await FileSystem.writeAsStringAsync(filePath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Save Excel File",
      });
    } else {
      Alert.alert("Success", `File downloaded: ${fileName}`);
    }
  } catch (error) {
    console.error("Download error:", error);
    Alert.alert("Error", error.message || "Failed to download Excel file");
  }
};
