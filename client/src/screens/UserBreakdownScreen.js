import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from "react-native";
import { API_BASE_URL } from "../constants/config";

const UserBreakdownScreen = ({ navigation, route }) => {
  const { userId, userName, password } = route.params;
  const [classDetails, setClassDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userFrozen, setUserFrozen] = useState(false);

  useEffect(() => {
    fetchUserBreakdown();
  }, []);

  const fetchUserBreakdown = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/user/${userId}/breakdown`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        }
      );

      const data = await response.json();
      if (data.success) {
        setClassDetails(data.data.classDetails);
        // Check if frozen by checking first student
        if (data.data.classDetails.length > 0 && data.data.classDetails[0].students.length > 0) {
          setUserFrozen(data.data.classDetails[0].students[0].frozen);
        }
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserBreakdown();
    setRefreshing(false);
  };

  const handleFreezeUser = async () => {
    Alert.alert(
      "Freeze Attendance",
      `Are you sure you want to freeze ${userName}'s attendance? No changes will be allowed.`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Freeze",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/api/admin/user/${userId}/freeze`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password })
                }
              );

              const data = await response.json();
              if (data.success) {
                setUserFrozen(true);
                Alert.alert("Success", "Attendance frozen successfully");
                fetchUserBreakdown();
              } else {
                Alert.alert("Error", data.message);
              }
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  const handleUnfreezeUser = async () => {
    Alert.alert(
      "Unfreeze Attendance",
      `Unfreeze ${userName}'s attendance?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Unfreeze",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/api/admin/user/${userId}/unfreeze`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password })
                }
              );

              const data = await response.json();
              if (data.success) {
                setUserFrozen(false);
                Alert.alert("Success", "Attendance unfrozen successfully");
                fetchUserBreakdown();
              } else {
                Alert.alert("Error", data.message);
              }
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  const handleExportUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/export/user/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        Alert.alert("Success", "Excel file downloaded successfully");
      } else {
        Alert.alert("Error", "Failed to download");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const renderClassDetails = ({ item: classItem }) => (
    <View style={styles.classCard}>
      <View style={styles.classHeader}>
        <View>
          <Text style={styles.className}>{classItem.className}</Text>
          <Text style={styles.studentCount}>{classItem.students.length} Students</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: userFrozen ? "#E74C3C" : "#27AE60" }]}>
            {userFrozen ? "🔒 Frozen" : "🔓 Active"}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryNum, { color: "#27AE60" }]}>
            {classItem.summary.present}
          </Text>
          <Text style={styles.summaryLbl}>Present</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryNum, { color: "#E74C3C" }]}>
            {classItem.summary.absent}
          </Text>
          <Text style={styles.summaryLbl}>Absent</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryNum, { color: "#F39C12" }]}>
            {classItem.summary.od}
          </Text>
          <Text style={styles.summaryLbl}>OD</Text>
        </View>
      </View>

      <Text style={styles.studentsTitle}>Students:</Text>
      <View style={styles.studentsList}>
        {classItem.students.map((student, idx) => (
          <View key={idx} style={styles.studentItem}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentRoll}>{student.rollNo} • {student.phone}</Text>
            </View>
            <View style={[styles.statusPill, {
              backgroundColor: student.status === "present" ? "#d4edda" : 
                               student.status === "absent" ? "#f8d7da" : "#fff3cd"
            }]}>
              <Text style={[styles.statusPillText, {
                color: student.status === "present" ? "#155724" : 
                       student.status === "absent" ? "#721c24" : "#856404"
              }]}>
                {student.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{userName}</Text>
          <Text style={styles.headerSubtitle}>Class Breakdown</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.badgeText}>{classDetails.length}</Text>
          <Text style={styles.badgeLabel}>Classes</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, userFrozen ? styles.unfreezeBtn : styles.freezeBtn]}
              onPress={userFrozen ? handleUnfreezeUser : handleFreezeUser}
            >
              <Text style={styles.actionBtnText}>
                {userFrozen ? "🔓 Unfreeze" : "🔒 Freeze"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportBtn} onPress={handleExportUser}>
              <Text style={styles.actionBtnText}>📥 Export</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={classDetails}
            renderItem={renderClassDetails}
            keyExtractor={(item) => item.classId}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  header: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff"
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#ddd",
    marginTop: 4
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff"
  },
  badgeLabel: {
    fontSize: 11,
    color: "#fff",
    marginTop: 2
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    paddingTop: 12
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  freezeBtn: {
    backgroundColor: "#E74C3C"
  },
  unfreezeBtn: {
    backgroundColor: "#27AE60"
  },
  exportBtn: {
    flex: 1,
    backgroundColor: "#3498DB",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13
  },
  listContent: {
    padding: 12,
    paddingTop: 0
  },
  classCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  className: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },
  studentCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 4
  },
  statusBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600"
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8
  },
  summaryBox: {
    alignItems: "center"
  },
  summaryNum: {
    fontSize: 16,
    fontWeight: "bold"
  },
  summaryLbl: {
    fontSize: 11,
    color: "#666",
    marginTop: 3
  },
  studentsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8
  },
  studentsList: {
    backgroundColor: "#fafafa",
    borderRadius: 6,
    overflow: "hidden"
  },
  studentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  studentInfo: {
    flex: 1
  },
  studentName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333"
  },
  studentRoll: {
    fontSize: 11,
    color: "#666",
    marginTop: 2
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize"
  }
});

export default UserBreakdownScreen;
