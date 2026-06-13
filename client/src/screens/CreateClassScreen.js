import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import api, { getErrorMessage } from "../services/api";
import { COLORS } from "../constants/config";

export default function CreateClassScreen({ navigation, user }) {
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickExcel = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv"
      ],
      copyToCacheDirectory: true,
      multiple: false
    });

    if (!picked.canceled) {
      setSelectedFile(picked.assets?.[0] || null);
    }
  };

  const importSelectedFile = async (classId) => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append("file", {
      uri: selectedFile.uri,
      name: selectedFile.name || "students.xlsx",
      type:
        selectedFile.mimeType ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    await api.post(`/api/classes/${classId}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Class name required", "Enter a class name.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/api/classes", {
        name: name.trim(),
        userId: user._id
      });
      await importSelectedFile(response.data.data._id);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Unable to create class", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Class</Text>
          <View style={styles.headerIcon} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Class Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter class name"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Upload Students (Excel)</Text>
          <Pressable style={styles.uploadBox} onPress={pickExcel}>
            <Ionicons name="cloud-upload-outline" size={44} color={COLORS.blue} />
            <Text style={styles.uploadTitle}>
              {selectedFile ? selectedFile.name : "Tap to upload Excel file"}
            </Text>
            <Text style={styles.uploadText}>
              {selectedFile ? "File ready to import" : "Only .xlsx files are allowed"}
            </Text>
          </Pressable>

          <Text style={styles.orText}>Or Add Manually</Text>
          <Pressable style={styles.secondaryButton}>
            <Ionicons name="add" size={18} color={COLORS.blue} />
            <Text style={styles.secondaryText}>Add Students Manually</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Create Class</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  container: {
    flex: 1,
    paddingHorizontal: 20
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  form: {
    flex: 1,
    paddingTop: 18
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 24
  },
  uploadBox: {
    height: 190,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#BBC8D8",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24
  },
  uploadTitle: {
    marginTop: 14,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  uploadText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  orText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 12
  },
  secondaryButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.blueSoft,
    borderWidth: 1,
    borderColor: "#CBE0FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryText: {
    marginLeft: 8,
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "900"
  },
  button: {
    height: 54,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900"
  }
});
