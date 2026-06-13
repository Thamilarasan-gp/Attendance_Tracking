import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import api, { getErrorMessage } from "../services/api";
import { joinClassRoom, socket } from "../services/socket";
import StudentCard from "../components/StudentCard";
import SummaryCard from "../components/SummaryCard";
import { COLORS } from "../constants/config";

const statusLabels = {
  present: "Present",
  od: "OD",
  absent: "Absent"
};

export default function AttendanceScreen({ navigation, route }) {
  const { classItem } = route.params;
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    total: classItem.studentCount || 0,
    present: 0,
    od: 0,
    absent: classItem.studentCount || 0
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [resetting, setResetting] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const tapTimer = useRef(null);
  const lastTap = useRef({ id: "", time: 0 });

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const [studentResponse, summaryResponse] = await Promise.all([
        api.get(`/api/classes/${classItem._id}/students`),
        api.get(`/api/classes/${classItem._id}/summary`)
      ]);
      setStudents(studentResponse.data.data || []);
      setSummary(summaryResponse.data.data || summary);
    } catch (error) {
      Alert.alert("Unable to load attendance", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    joinClassRoom(classItem._id);

    const handleAttendanceUpdated = ({ studentId, status }) => {
      setStudents((current) =>
        current.map((student) =>
          student._id === studentId ? { ...student, status } : student
        )
      );
    };

    const handleAttendanceReset = () => {
      setStudents((current) =>
        current.map((student) => ({ ...student, status: "absent" }))
      );
    };

    const handleSummaryUpdated = (nextSummary) => {
      setSummary(nextSummary);
    };

    socket.on("attendanceUpdated", handleAttendanceUpdated);
    socket.on("attendanceReset", handleAttendanceReset);
    socket.on("summaryUpdated", handleSummaryUpdated);

    return () => {
      socket.off("attendanceUpdated", handleAttendanceUpdated);
      socket.off("attendanceReset", handleAttendanceReset);
      socket.off("summaryUpdated", handleSummaryUpdated);
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
    };
  }, []);

  const computedSummary = useMemo(() => {
    const total = students.length;
    const present = students.filter((student) => student.status === "present").length;
    const od = students.filter((student) => student.status === "od").length;
    const absent = students.filter((student) => student.status === "absent").length;
    return { total, present, od, absent };
  }, [students]);

  const visibleSummary = students.length ? computedSummary : summary;

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

  const presentStudents = useMemo(
    () => students.filter((student) => student.status === "present"),
    [students]
  );
  const odStudents = useMemo(
    () => students.filter((student) => student.status === "od"),
    [students]
  );
  const absentStudents = useMemo(
    () => students.filter((student) => student.status === "absent"),
    [students]
  );

  const updateStatus = async (student, status) => {
    try {
      setUpdatingId(student._id);
      setStudents((current) =>
        current.map((item) =>
          item._id === student._id ? { ...item, status } : item
        )
      );
      const response = await api.patch(`/api/students/${student._id}/status`, {
        status
      });
      setStudents((current) =>
        current.map((item) =>
          item._id === student._id ? response.data.data : item
        )
      );
    } catch (error) {
      Alert.alert("Unable to update attendance", getErrorMessage(error));
      loadAttendance();
    } finally {
      setUpdatingId("");
    }
  };

  const handleStudentTap = (student) => {
    const now = Date.now();
    const isDoubleTap =
      lastTap.current.id === student._id && now - lastTap.current.time < 280;

    if (isDoubleTap) {
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
      lastTap.current = { id: "", time: 0 };
      updateStatus(student, "od");
      return;
    }

    lastTap.current = { id: student._id, time: now };
    tapTimer.current = setTimeout(() => {
      const nextStatus = student.status === "present" ? "absent" : "present";
      updateStatus(student, nextStatus);
    }, 290);
  };

  const copyRollNos = async (items, title) => {
    const text = items.length
      ? items.map((student) => student.rollNo).join("\n")
      : "Nil";
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${title} roll numbers copied.`);
  };

  const copyReport = async () => {
    try {
      const response = await api.get(`/api/classes/${classItem._id}/report`);
      await Clipboard.setStringAsync(response.data.data.reportText || "");
      Alert.alert("Copied", "Attendance report copied.");
    } catch (error) {
      Alert.alert("Unable to copy report", getErrorMessage(error));
    }
  };

  const resetAttendance = () => {
    Alert.alert(
      "Reset Attendance",
      "Are you sure you want to reset attendance for this class? All students will be marked as absent.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              setResetting(true);
              const response = await api.post(
                `/api/classes/${classItem._id}/reset`
              );
              setStudents((current) =>
                current.map((student) => ({ ...student, status: "absent" }))
              );
              if (response.data.data?.summary) {
                setSummary(response.data.data.summary);
              }
            } catch (error) {
              Alert.alert("Unable to reset attendance", getErrorMessage(error));
            } finally {
              setResetting(false);
            }
          }
        }
      ]
    );
  };

  const callStudent = (student) => {
    if (!student.phone) {
      Alert.alert("No phone number", "This student has no phone number.");
      return;
    }
    Linking.openURL(`tel:${student.phone}`);
  };

  const marked = visibleSummary.present + visibleSummary.od;
  const progress =
    visibleSummary.total > 0 ? marked / visibleSummary.total : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{classItem.name}</Text>
          <Pressable style={styles.headerIcon} onPress={() => setHelpVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.summaryPanel}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.totalLabel}>Total Students</Text>
              <Text style={styles.totalValue}>{visibleSummary.total}</Text>
            </View>
            <Pressable
              style={styles.resetButton}
              onPress={resetAttendance}
              disabled={resetting}
            >
              {resetting ? (
                <ActivityIndicator size="small" color={COLORS.red} />
              ) : (
                <Text style={styles.resetText}>Reset</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.summaryCards}>
            <SummaryCard
              label="Present"
              value={visibleSummary.present}
              color={COLORS.green}
              softColor={COLORS.greenSoft}
            />
            <SummaryCard
              label="OD"
              value={visibleSummary.od}
              color={COLORS.yellow}
              softColor={COLORS.yellowSoft}
            />
            <SummaryCard
              label="Absent"
              value={visibleSummary.absent}
              color={COLORS.red}
              softColor={COLORS.redSoft}
            />
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              Marked {marked} / {visibleSummary.total}
            </Text>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
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

        {loading ? (
          <ActivityIndicator color={COLORS.blue} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Add students to begin</Text>
              </View>
            }
            renderItem={({ item }) => (
              <StudentCard
                student={item}
                showStatus
                disabled={updatingId === item._id}
                onPress={() => handleStudentTap(item)}
              />
            )}
            ListFooterComponent={
              <View style={styles.sections}>
                <StatusSection
                  title="Present Students"
                  color={COLORS.green}
                  students={presentStudents}
                  onCopy={() => copyRollNos(presentStudents, "Present")}
                  copyLabel="Copy Present Roll Nos"
                />
                <StatusSection
                  title="OD Students"
                  color={COLORS.yellow}
                  students={odStudents}
                  onCopy={() => copyRollNos(odStudents, "OD")}
                  copyLabel="Copy OD Roll Nos"
                />
                <StatusSection
                  title="Absent Students"
                  color={COLORS.red}
                  students={absentStudents}
                  onCopy={() => copyRollNos(absentStudents, "Absent")}
                  copyLabel="Copy Absent Roll Nos"
                  onCall={callStudent}
                />
              </View>
            }
          />
        )}

        <Pressable style={styles.copyReportButton} onPress={copyReport}>
          <Ionicons name="copy-outline" size={18} color={COLORS.white} />
          <Text style={styles.copyReportText}>Copy Report</Text>
        </Pressable>
      </View>

      <Modal transparent visible={helpVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.helpCard}>
            <InstructionRow
              color={COLORS.green}
              title="Single Tap"
              text="Mark as Present / Absent"
            />
            <InstructionRow color={COLORS.yellow} title="Double Tap" text="Mark as OD" />
            <InstructionRow
              color={COLORS.red}
              title="Default Status"
              text="Absent"
            />
            <Pressable style={styles.okButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.okText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InstructionRow({ color, title, text }) {
  return (
    <View style={styles.instructionRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.instructionTitle}>{title}</Text>
        <Text style={styles.instructionText}>{text}</Text>
      </View>
    </View>
  );
}

function StatusSection({ title, color, students, onCopy, copyLabel, onCall }) {
  return (
    <View style={styles.statusSection}>
      <Text style={[styles.statusTitle, { color }]}>
        {title} ({students.length})
      </Text>
      {students.slice(0, 6).map((student) => (
        <StudentCard
          key={student._id}
          student={student}
          onCall={onCall ? () => onCall(student) : undefined}
        />
      ))}
      {students.length === 0 && (
        <Text style={styles.noneText}>No {title.toLowerCase()}.</Text>
      )}
      <Pressable style={[styles.copyButton, { borderColor: color }]} onPress={onCopy}>
        <Ionicons name="copy-outline" size={17} color={color} />
        <Text style={[styles.copyButtonText, { color }]}>{copyLabel}</Text>
      </Pressable>
    </View>
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
  summaryPanel: {
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    padding: 14,
    marginBottom: 14
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  totalLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900"
  },
  totalValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4
  },
  resetButton: {
    minWidth: 76,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.redSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  resetText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: "900"
  },
  summaryCards: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  progressBar: {
    height: 5,
    borderRadius: 5,
    backgroundColor: "#EDF1F6",
    overflow: "hidden",
    marginTop: 14
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.green
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8
  },
  progressText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800"
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
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700"
  },
  loader: {
    marginTop: 40
  },
  empty: {
    padding: 24,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center"
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  sections: {
    paddingTop: 12,
    paddingBottom: 82
  },
  statusSection: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#EEF2F7"
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12
  },
  noneText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12
  },
  copyButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8
  },
  copyButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "900"
  },
  copyReportButton: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 16,
    height: 54,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  copyReportText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28
  },
  helpCard: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: COLORS.white,
    padding: 20
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 14
  },
  instructionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  instructionText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  okButton: {
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12
  },
  okText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900"
  }
});
