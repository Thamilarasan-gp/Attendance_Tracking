import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
// Import SafeAreaView from safe-area-context instead of react-native
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import api, { getErrorMessage } from "../services/api";
import StudentCard from "../components/StudentCard";
import { COLORS } from "../constants/config";

const emptyForm = {
  rollNo: "",
  name: "",
  phone: ""
};

export default function StudentListScreen({ navigation, route }) {
  const { classItem } = route.params;
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadStudents = async () => {
    try {
      const response = await api.get(`/api/classes/${classItem._id}/students`);
      setStudents(response.data.data || []);
    } catch (error) {
      Alert.alert("Unable to load students", getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [])
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const rollNo = String(student.rollNo || "").toLowerCase();
      const name = String(student.name || "").toLowerCase();
      return rollNo.includes(query) || name.includes(query);
    });
  }, [students, search]);

  const openAddModal = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setForm({
      rollNo: student.rollNo || "",
      name: student.name || "",
      phone: student.phone || ""
    });
    setModalVisible(true);
  };

  const saveStudent = async () => {
    if (!form.rollNo.trim() || !form.name.trim() || !form.phone.trim()) {
      Alert.alert("Missing details", "Roll number, name, and phone are required.");
      return;
    }

    try {
      setSaving(true);
      if (editingStudent) {
        const response = await api.put(`/api/students/${editingStudent._id}`, {
          rollNo: form.rollNo.trim(),
          name: form.name.trim(),
          phone: form.phone.trim()
        });
        setStudents((current) =>
          current.map((item) =>
            item._id === editingStudent._id ? response.data.data : item
          )
        );
      } else {
        const response = await api.post(
          `/api/classes/${classItem._id}/students`,
          {
            rollNo: form.rollNo.trim(),
            name: form.name.trim(),
            phone: form.phone.trim()
          }
        );
        setStudents((current) => [...current, response.data.data]);
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Unable to save student", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = (student) => {
    Alert.alert("Delete Student", `Delete ${student.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/students/${student._id}`);
            setStudents((current) =>
              current.filter((item) => item._id !== student._id)
            );
          } catch (error) {
            Alert.alert("Unable to delete student", getErrorMessage(error));
          }
        }
      }
    ]);
  };

  const importExcel = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv"
        ],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (picked.canceled) {
        return;
      }

      const file = picked.assets?.[0];
      if (!file) {
        return;
      }

      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name || "students.xlsx",
        type:
          file.mimeType ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      setImporting(true);
      const response = await api.post(
        `/api/classes/${classItem._id}/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const data = response.data.data || {};
      Alert.alert(
        "Import complete",
        `Inserted: ${data.insertedCount || 0}\nSkipped: ${data.skippedCount || 0}`
      );
      loadStudents();
    } catch (error) {
      Alert.alert("Unable to import students", getErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  const refresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  return (
    // 'edges' config ensures we protect the notch at the top without breaking layout at the bottom
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{classItem.name}</Text>
          <Pressable style={styles.headerIcon} onPress={importExcel}>
            {importing ? (
              <ActivityIndicator size="small" color={COLORS.blue} />
            ) : (
              <Ionicons name="download-outline" size={22} color={COLORS.text} />
            )}
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or roll no"
            placeholderTextColor={COLORS.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.countCard}>
          <View>
            <Text style={styles.countLabel}>Total Students</Text>
            <Text style={styles.countValue}>{students.length}</Text>
          </View>
          <Pressable style={styles.addIcon} onPress={openAddModal}>
            <Ionicons name="add" size={22} color={COLORS.blue} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.blue} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Add students to begin</Text>
                <Text style={styles.emptyText}>
                  Add manually or import an Excel sheet.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <StudentCard
                student={item}
                showActions
                onEdit={() => openEditModal(item)}
                onDelete={() => deleteStudent(item)}
              />
            )}
          />
        )}

        <View style={styles.footer}>
          <Pressable style={styles.outlineButton} onPress={importExcel}>
            <Ionicons name="cloud-upload-outline" size={18} color={COLORS.blue} />
            <Text style={styles.outlineText}>Import Excel</Text>
          </Pressable>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              navigation.navigate("Attendance", {
                classItem: {
                  ...classItem,
                  studentCount: students.length
                }
              })
            }
          >
            <Text style={styles.primaryText}>Start Attendance</Text>
          </Pressable>
        </View>
      </View>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingStudent ? "Edit Student" : "Add Student"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Roll Number"
              placeholderTextColor={COLORS.muted}
              value={form.rollNo}
              onChangeText={(value) => setForm({ ...form, rollNo: value })}
            />
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={COLORS.muted}
              value={form.name}
              onChangeText={(value) => setForm({ ...form, name: value })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor={COLORS.muted}
              value={form.phone}
              onChangeText={(value) => setForm({ ...form, phone: value })}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={saveStudent}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  searchBox: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 14
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700"
  },
  countCard: {
    minHeight: 82,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  countLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900"
  },
  countValue: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900"
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.blueSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  loader: {
    marginTop: 50
  },
  empty: {
    padding: 26,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    marginTop: 30
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 8,
    fontWeight: "600"
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: COLORS.background
  },
  outlineButton: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBE0FF",
    backgroundColor: COLORS.blueSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  outlineText: {
    marginLeft: 6,
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "900"
  },
  primaryButton: {
    flex: 1.3,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22
  },
  modalCard: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: COLORS.white,
    padding: 20
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 18
  },
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#F1F4F8",
    alignItems: "center",
    justifyContent: "center"
  },
  cancelText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800"
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center"
  },
  disabledButton: {
    opacity: 0.7
  },
  saveText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900"
  }
});