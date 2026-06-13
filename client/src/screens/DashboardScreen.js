import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  View
} from "react-native";
import { CircleUserRound } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api, { getErrorMessage } from "../services/api";
import ClassCard from "../components/ClassCard";
import { COLORS } from "../constants/config";

export default function DashboardScreen({ navigation, user, onLogout }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const deleteClass = async (classId) => {
    try {
      await api.delete(`/api/classes/${classId}`);
      setClasses((current) => current.filter((item) => item._id !== classId));
    } catch (error) {
      Alert.alert("Unable to delete class", getErrorMessage(error));
    }
  };

  const confirmDeleteClass = (classItem) => {
    Alert.alert(
      "Delete Class",
      `Are you sure you want to delete ${classItem.name}? This will remove all students in this class.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteClass(classItem._id)
        }
      ]
    );
  };

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
            return {
              ...item,
              studentCount: 0
            };
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
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: onLogout
      }
    ]);
  };
const handleProfileClick = () => {
  Alert.alert(
    "🚧 Under Development",
    "Profile feature is currently under progress and will be available soon.",
    [{ text: "OK" }]
  );
};
  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
        <Pressable
  style={styles.headerIcon}
  onPress={handleProfileClick}
>
  <CircleUserRound
    size={32}
    color={COLORS.text}
    strokeWidth={2}
  />
</Pressable>

          <Text style={styles.headerTitle}>
            Dashboard
          </Text>

          <Pressable
            style={styles.headerIcon}
            onPress={confirmLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={COLORS.text}
            />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.leftContent}>
            <Text style={styles.welcomeText}>Welcome,</Text>

            <Text style={styles.nameText}>
              {user?.name || "User"} 👋
            </Text>

            <Text style={styles.subText}>
              Take attendance for your classes{"\n"}
              and keep tracking with ease.
            </Text>

            <TouchableOpacity style={styles.classCard}>
              <View style={styles.classLeft}>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color="#2563EB"
                />

                <View>
                  <Text style={styles.classTitle}>
                    Today's Classes
                  </Text>

                  <Text style={styles.classCount}>
                    {classes.length} Class{classes.length !== 1 ? 'es' : ''} Scheduled
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={24}
                color="#0F172A"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rightContent}>
            <Image
              source={require("../../assets/clipboard.png")}
              style={styles.clipboardImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            My Classes
          </Text>

          <Pressable
            style={styles.createButton}
            onPress={() =>
              navigation.navigate("CreateClass")
            }
          >
            <Ionicons
              name="add"
              size={16}
              color={COLORS.white}
            />

            <Text style={styles.createText}>
              Create Class
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator
            color={COLORS.blue}
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>
                  Create your first class
                </Text>

                <Text style={styles.emptyText}>
                  Add a class to begin managing placement attendance.
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <ClassCard
                item={item}
                index={index}
                onPress={() =>
                  navigation.navigate(
                    "StudentList",
                    {
                      classItem: item
                    }
                  )
                }
                onLongPress={() => confirmDeleteClass(item)}
              />
            )}
          ListFooterComponent={
  <View style={styles.footer}>
    <Ionicons
      name="code-slash-outline"
      size={14}
      color="#64748B"
    />

    <Text style={styles.footerText}>
      Crafted by Thamilarasan GP
    </Text>

    <View style={styles.dot} />

    <Text style={styles.footerYear}>
      2026
    </Text>
  </View>
}
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
classCard: {
  backgroundColor: "#FFFFFF",
  width:220,
  height:60,
  borderRadius: 18,
  marginTop: 14,
  paddingHorizontal: 20,
  paddingVertical: 10,

  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",

  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 6,
  shadowOffset: {
    width: 0,
    height: 2,
  },

  elevation: 2,
},

classLeft: {
  flexDirection: "row",
  alignItems: "center",
},

classTitle: {
  fontSize: 11,
  fontWeight: "700",
  color: "#334155",
  marginLeft: 10,
},

classCount: {
  fontSize: 10,
  fontWeight: "800",
  color: "#2563EB",
  marginLeft: 10,
  marginTop: 2,
},
  header: {
    height: 60,
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

  heroCard: {
  backgroundColor: "#EAF4FF",
  borderRadius: 24,
  padding: 18,
  marginBottom: 18,
  minHeight: 180,
  flexDirection: "row",
  alignItems: "center",

  shadowColor: "#2563EB",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: {
    width: 0,
    height: 4,
  },
  elevation: 4,
},

leftContent: {
  flex: 1,
},

rightContent: {
  width: 95,
  alignItems: "center",
  justifyContent: "center",
},

clipboardImage: {
  width: 190,
  height: 190,
},

welcomeText: {
  fontSize: 15,
  fontWeight: "700",
  color: "#475569",
},

nameText: {
  fontSize: 24,
  fontWeight: "900",
  color: "#0F172A",
  marginTop: 2,
},

subText: {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 20,
  color: "#64748B",
},

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 20,
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
  },
footer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 20,
  marginBottom: 25,
},

footerText: {
  fontSize: 12,
  color: "#64748B",
  fontWeight: "600",
  marginLeft: 4,
},

dot: {
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: "#CBD5E1",
  marginHorizontal: 8,
},

footerYear: {
  fontSize: 12,
  color: "#94A3B8",
  fontWeight: "500",
},
});