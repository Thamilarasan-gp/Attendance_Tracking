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
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/config";
import { downloadExcel } from "../services/downloadService";

const AdminDashboardScreen = ({ navigation, route }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const password = route.params?.password || "sece#2739";

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
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
    await fetchUsersData();
    setRefreshing(false);
  };

  const handleExportAllUsers = async () => {
    try {
      await downloadExcel(
        `${API_BASE_URL}/api/admin/export/all-users`,
        password,
        `All_Users_Attendance_${Date.now()}.xlsx`
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const renderUserCard = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.overallBadge}>
          <Text style={styles.badgeText}>{item.classBreakdown.length}</Text>
          <Text style={styles.badgeLabel}>Classes</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#27AE60" }]}>
            {item.overallSummary.present}
          </Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#E74C3C" }]}>
            {item.overallSummary.absent}
          </Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#F39C12" }]}>
            {item.overallSummary.od}
          </Text>
          <Text style={styles.summaryLabel}>OD</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#3498DB" }]}>
            {item.overallSummary.total}
          </Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.classBreakdown}>
        <Text style={styles.breakdownTitle}>Class Breakdown:</Text>
        {item.classBreakdown.map((classItem, idx) => (
          <Text key={idx} style={styles.classInfo}>
            {classItem.className}: P:{classItem.present} A:{classItem.absent} OD:{classItem.od}
          </Text>
        ))}
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() =>
            navigation.navigate("UserBreakdown", {
              userId: item.userId,
              userName: item.name,
              password
            })
          }
        >
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.successButton]}
          onPress={() =>
            navigation.navigate("UserTracking", {
              userId: item.userId,
              userName: item.name,
              password
            })
          }
        >
          <Text style={styles.buttonText}>Track</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.infoButton]}
          onPress={() => handleExportUser(item.userId, item.name)}
        >
          <Text style={styles.buttonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() => handleDeleteConfirm(item.userId, item.name)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleExportUser = async (userId, userName) => {
    try {
      await downloadExcel(
        `${API_BASE_URL}/api/admin/export/user/${userId}`,
        password,
        `${userName}_Attendance_${Date.now()}.xlsx`
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteConfirm = (userId, userName) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to permanently delete ${userName} and all their data? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDeleteUser(userId) }
      ]
    );
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/user/${userId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert("Deleted", "User deleted successfully");
        await fetchUsersData();
      } else {
        Alert.alert("Error", data.message || "Unable to delete user");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity
          style={styles.exportAllButton}
          onPress={handleExportAllUsers}
        >
          <Text style={styles.exportAllText}>Export All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.userId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff"
  },
  exportAllButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  exportAllText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 13
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  listContent: {
    padding: 12
  },
  userCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 12
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333"
  },
  userEmail: {
    fontSize: 13,
    color: "#666",
    marginTop: 4
  },
  overallBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center"
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8
  },
  summaryItem: {
    alignItems: "center"
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold"
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4
  },
  classBreakdown: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 12
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6
  },
  classInfo: {
    fontSize: 12,
    color: "#555",
    marginBottom: 4
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 10
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center"
  },
  primaryButton: {
    backgroundColor: "#007AFF"
  },
  successButton: {
    backgroundColor: "#27AE60"
  },
  infoButton: {
    backgroundColor: "#3498DB"
  },
  dangerButton: {
    backgroundColor: "#E74C3C"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12
  }
});

export default AdminDashboardScreen;
