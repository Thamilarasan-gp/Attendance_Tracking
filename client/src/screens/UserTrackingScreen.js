import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity
} from "react-native";
import { API_BASE_URL } from "../constants/config";

const UserTrackingScreen = ({ navigation, route }) => {
  const { userId, userName, password } = route.params;
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDateWiseTracking();
  }, []);

  const fetchDateWiseTracking = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/date-wise-tracking/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        }
      );

      const data = await response.json();
      if (data.success) {
        setTrackingData(data.data);
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
    await fetchDateWiseTracking();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderStudentTracking = ({ item }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentRoll}>{item.rollNo} • {item.phone}</Text>
        </View>
        <View style={styles.lockBadge}>
          <Text style={styles.lockText}>
            {item.frozen ? "🔒" : "🔓"}
          </Text>
        </View>
      </View>

      <View style={styles.currentStatusContainer}>
        <Text style={styles.currentStatusLabel}>Current Status:</Text>
        <View style={[styles.currentStatusBadge, {
          backgroundColor: item.currentStatus === "present" ? "#d4edda" : 
                           item.currentStatus === "absent" ? "#f8d7da" : "#fff3cd"
        }]}>
          <Text style={[styles.currentStatusText, {
            color: item.currentStatus === "present" ? "#155724" : 
                   item.currentStatus === "absent" ? "#721c24" : "#856404"
          }]}>
            {item.currentStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      {item.dateWiseHistory && item.dateWiseHistory.length > 0 ? (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Attendance History:</Text>
          {item.dateWiseHistory.map((record, idx) => (
            <View key={idx} style={styles.historyItem}>
              <View style={styles.dateSection}>
                <Text style={styles.dateText}>{formatDate(record.date)}</Text>
              </View>
              <View style={[styles.historyStatusBadge, {
                backgroundColor: record.status === "present" ? "#d4edda" : 
                                 record.status === "absent" ? "#f8d7da" : "#fff3cd"
              }]}>
                <Text style={[styles.historyStatusText, {
                  color: record.status === "present" ? "#155724" : 
                         record.status === "absent" ? "#721c24" : "#856404"
                }]}>
                  {record.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noHistoryText}>No attendance history</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{userName}</Text>
          <Text style={styles.headerSubtitle}>Date-wise Tracking</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.badgeText}>{trackingData.length}</Text>
          <Text style={styles.badgeLabel}>Students</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={trackingData}
          renderItem={renderStudentTracking}
          keyExtractor={(item) => item.studentId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  listContent: {
    padding: 12
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },
  studentRoll: {
    fontSize: 12,
    color: "#666",
    marginTop: 4
  },
  lockBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6
  },
  lockText: {
    fontSize: 16
  },
  currentStatusContainer: {
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  currentStatusLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333"
  },
  currentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  currentStatusText: {
    fontSize: 12,
    fontWeight: "600"
  },
  historyContainer: {
    marginTop: 10
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fafafa",
    marginBottom: 6,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF"
  },
  dateSection: {
    flex: 1
  },
  dateText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500"
  },
  historyStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize"
  },
  noHistoryText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    paddingVertical: 10,
    textAlign: "center"
  }
});

export default UserTrackingScreen;
