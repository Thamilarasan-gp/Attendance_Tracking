import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
// Import SafeAreaView from safe-area-context instead of react-native
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import api, { getErrorMessage } from "../services/api";
import { COLORS } from "../constants/config";

export default function CreateClassScreen({ navigation, user }) {
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState({
    rollNo: "",
    name: "",
    phone: ""
  });
  const [manualStudents, setManualStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const addManualStudent = () => {
    const rollNo = manualForm.rollNo.trim();
    const studentName = manualForm.name.trim();
    const phone = manualForm.phone.trim();

    if (!rollNo || !studentName || !phone) {
      Alert.alert("Missing details", "Roll number, name, and phone are required.");
      return;
    }

    const alreadyAdded = manualStudents.some(
      (student) => student.rollNo.toLowerCase() === rollNo.toLowerCase()
    );

    if (alreadyAdded) {
      Alert.alert("Duplicate roll number", "This roll number is already in the list.");
      return;
    }

    setManualStudents((current) => [
      ...current,
      {
        rollNo,
        name: studentName,
        phone
      }
    ]);

    setManualForm({
      rollNo: "",
      name: "",
      phone: ""
    });
  };

  const removeManualStudent = (rollNo) => {
    setManualStudents((current) =>
      current.filter((student) => student.rollNo !== rollNo)
    );
  };

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

    if (!manualMode && !selectedFile) {
      Alert.alert(
        "No student source selected",
        "Upload an Excel file or switch to manual mode."
      );
      return;
    }

    if (manualMode && manualStudents.length === 0) {
      Alert.alert("No students added", "Add at least one student manually.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/api/classes", {
        name: name.trim(),
        userId: user._id
      });
      const createdClass = response.data.data;

      if (manualMode) {
        const results = await Promise.allSettled(
          manualStudents.map((student) =>
            api.post(`/api/classes/${createdClass._id}/students`, student)
          )
        );

        const successCount = results.filter(
          (result) => result.status === "fulfilled"
        ).length;
        const failedCount = results.length - successCount;

        if (failedCount > 0) {
          Alert.alert(
            "Class created with warnings",
            `${successCount} students added, ${failedCount} failed. You can fix them in Student List.`
          );
        }

        navigation.replace("StudentList", {
          classItem: {
            ...createdClass,
            studentCount: successCount
          }
        });
        return;
      }

      await importSelectedFile(createdClass._id);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Unable to create class", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Edges are set explicitly to wrap your entire dynamic UI properly around device cameras/home indicators
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
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

        <ScrollView
          style={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Class Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter class name"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
          />

          {!manualMode ? (
            <>
              <Text style={styles.label}>Upload Students (Excel)</Text>
              <Pressable style={styles.uploadBox} onPress={pickExcel}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={44}
                  color={COLORS.blue}
                />
                <Text style={styles.uploadTitle}>
                  {selectedFile ? selectedFile.name : "Tap to upload Excel file"}
                </Text>
                <Text style={styles.uploadText}>
                  {selectedFile
                    ? "File ready to import"
                    : "Only .xlsx and .csv files are allowed"}
                </Text>
              </Pressable>
            </>
          ) : null}

          <Text style={styles.orText}>Or Add Manually</Text>
          <Pressable
            style={[
              styles.secondaryButton,
              manualMode && styles.secondaryButtonActive
            ]}
            onPress={() => {
              setManualMode((value) => !value);
              setSelectedFile(null);
            }}
          >
            <Ionicons
              name={manualMode ? "checkmark-circle" : "add"}
              size={18}
              color={COLORS.blue}
            />
            <Text style={styles.secondaryText}>
              {manualMode ? "Manual Add Selected" : "Add Students Manually"}
            </Text>
          </Pressable>

          {manualMode ? (
            <View style={styles.manualCard}>
              <Text style={styles.manualTitle}>Add Students</Text>

              <TextInput
                style={styles.manualInput}
                placeholder="Roll Number"
                placeholderTextColor={COLORS.muted}
                value={manualForm.rollNo}
                onChangeText={(value) =>
                  setManualForm((current) => ({ ...current, rollNo: value }))
                }
              />

              <TextInput
                style={styles.manualInput}
                placeholder="Student Name"
                placeholderTextColor={COLORS.muted}
                value={manualForm.name}
                onChangeText={(value) =>
                  setManualForm((current) => ({ ...current, name: value }))
                }
              />

              <TextInput
                style={styles.manualInput}
                placeholder="Phone Number"
                placeholderTextColor={COLORS.muted}
                value={manualForm.phone}
                onChangeText={(value) =>
                  setManualForm((current) => ({ ...current, phone: value }))
                }
                keyboardType="phone-pad"
              />

              <Pressable style={styles.addManualButton} onPress={addManualStudent}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
                <Text style={styles.addManualText}>Add to List</Text>
              </Pressable>

              <Text style={styles.pendingCount}>
                Students to create: {manualStudents.length}
              </Text>

              {manualStudents.map((student) => (
                <View key={student.rollNo} style={styles.studentRow}>
                  <View>
                    <Text style={styles.studentRowName}>{student.name}</Text>
                    <Text style={styles.studentRowMeta}>
                      {student.rollNo} - {student.phone}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeManualStudent(student.rollNo)}
                    style={styles.removeStudentButton}
                  >
                    <Ionicons name="trash-outline" size={17} color={COLORS.red} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

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
  secondaryButtonActive: {
    borderColor: COLORS.blue,
    borderWidth: 1.5
  },
  secondaryText: {
    marginLeft: 8,
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "900"
  },
  manualCard: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 18
  },
  manualTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 12
  },
  manualInput: {
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10
  },
  addManualButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  addManualText: {
    marginLeft: 8,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900"
  },
  pendingCount: {
    marginTop: 12,
    marginBottom: 8,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800"
  },
  studentRow: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8
  },
  studentRowName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900"
  },
  studentRowMeta: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  removeStudentButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.redSoft
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