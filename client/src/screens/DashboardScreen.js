import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api, { getErrorMessage } from "../services/api";
import ClassCard from "../components/ClassCard";
import { COLORS } from "../constants/config";

export default function DashboardScreen({ navigation, user, onLogout }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClasses = async () => {
    try {
      const response = await api.get(`/api/classes/${user._id}`);
      const classList = response.data.data || [];
      const withCounts = await Promise.all(
        classList.map(async (item) => {
          try {
            const studentResponse = await api.get(
              `/api/classes/${item._id}/students`
            );
            return {
              ...item,
              studentCount: studentResponse.data.data?.length || 0
            };
          } catch {
            return { ...item, studentCount: 0 };
          }
        })
      );
      setClasses(withCounts);
    } catch (error) {
      Alert.alert("Unable to load classes", getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadClasses();
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Do you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: onLogout }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="menu" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Pressable style={styles.headerIcon} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.welcomeCard}>
          <View>
            <Text style={styles.welcomeTitle}>Welcome, {user.name}</Text>
            <Text style={styles.welcomeSubtitle}>
              Take attendance for your classes
            </Text>
          </View>
          <View style={styles.clipboard}>
            <Ionicons name="clipboard" size={32} color={COLORS.blue} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          <Pressable
            style={styles.createButton}
            onPress={() => navigation.navigate("CreateClass")}
          >
            <Ionicons name="add" size={16} color={COLORS.white} />
            <Text style={styles.createText}>Create Class</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.blue} style={styles.loader} />
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Create your first class</Text>
                <Text style={styles.emptyText}>
                  Add a class to begin managing placement attendance.
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <ClassCard
                item={item}
                index={index}
                onPress={() => navigation.navigate("StudentList", { classItem: item })}
              />
            )}
          />
        )}
      </View>
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  welcomeCard: {
    minHeight: 96,
    borderRadius: 10,
    padding: 18,
    backgroundColor: COLORS.blueSoft,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22
  },
  welcomeTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900"
  },
  welcomeSubtitle: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600"
  },
  clipboard: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center"
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900"
  },
  createButton: {
    height: 42,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.blue,
    paddingHorizontal: 14
  },
  createText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 4
  },
  loader: {
    marginTop: 60
  },
  empty: {
    marginTop: 60,
    padding: 22,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center"
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  emptyText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600"
  }
});
