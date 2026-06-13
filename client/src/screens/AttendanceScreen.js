import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  Animated,
  Vibration,
  Platform,
  StatusBar,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import api, { getErrorMessage } from "../services/api";
import { joinClassRoom, socket } from "../services/socket";

const { width, height } = Dimensions.get("window");

export const COLORS = {
  navy: "#061F3F",
  navyDark: "#03162D",
  blue: "#0D6EFD",
  blueSoft: "#EAF3FF",
  text: "#0F1E3A",
  muted: "#7A879B",
  border: "#DFE6F0",
  background: "#F6F8FC",
  white: "#FFFFFF",
  green: "#22B55B",
  greenSoft: "#E5F8ED",
  yellow: "#F7B500",
  yellowSoft: "#FFF4D8",
  red: "#EF3E46",
  redSoft: "#FFE7E9",
  shadow: "#B9C4D6"
};

const TABS = [
  { id: "All", label: "All" },
  { id: "Present", label: "Present" },
  { id: "OD", label: "On Duty" },
  { id: "Absent", label: "Absent" },
];

const getStatusColor = (status) => {
  switch (status) {
    case "present": return COLORS.green;
    case "od": return COLORS.yellow;
    default: return COLORS.red;
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "present": return "Present";
    case "od": return "On Duty";
    default: return "Absent";
  }
};

// ==========================================
// STUDENT CARD COMPONENT
// ==========================================
const StudentCard = React.memo(({ item, updatingId, onStatusUpdate, onCallPress }) => {
  const initials = item.name ? item.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "??";
  const statusColor = getStatusColor(item.status);
  const statusLabel = getStatusLabel(item.status);
  
  // Animation values
  const panX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const swipeLeftOpacity = useRef(new Animated.Value(0)).current;
  const swipeRightOpacity = useRef(new Animated.Value(0)).current;
  
  // Yellow animation for OD
  const yellowBackgroundAnim = useRef(new Animated.Value(0)).current;
  const yellowScaleAnim = useRef(new Animated.Value(1)).current;
  const yellowRotateAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const isSwiping = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => item.status === "od",
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return item.status === "od" && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        isSwiping.current = true;
      },
      onPanResponderMove: (_, gestureState) => {
        if (item.status === "od") {
          const newX = Math.min(Math.max(gestureState.dx, -100), 100);
          panX.setValue(newX);
          
          if (newX < 0) {
            swipeLeftOpacity.setValue(Math.min(Math.abs(newX) / 50, 1));
            swipeRightOpacity.setValue(0);
          } else if (newX > 0) {
            swipeRightOpacity.setValue(Math.min(newX / 50, 1));
            swipeLeftOpacity.setValue(0);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (item.status === "od") {
          if (gestureState.dx < -50) {
            Animated.timing(panX, {
              toValue: -100,
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              onStatusUpdate(item, "present");
              resetSwipe();
            });
          } else if (gestureState.dx > 50) {
            Animated.timing(panX, {
              toValue: 100,
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              onStatusUpdate(item, "absent");
              resetSwipe();
            });
          } else {
            resetSwipe();
          }
        }
        isSwiping.current = false;
      },
    })
  ).current;

  const resetSwipe = () => {
    Animated.parallel([
      Animated.spring(panX, {
        toValue: 0,
        useNativeDriver: false,
        tension: 40,
        friction: 8,
      }),
      Animated.timing(swipeLeftOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(swipeRightOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    if (item.status !== "od") {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: false,
        tension: 200,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (item.status !== "od") {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 200,
        friction: 10,
      }).start();
    }
  };

  const handlePress = () => {
    if (isSwiping.current) return;
    const nextStatus = item.status === "present" ? "absent" : "present";
    onStatusUpdate(item, nextStatus);
  };

  const handleLongPress = () => {
    if (item.status === "od") return;
    
    Vibration.vibrate([0, 60, 30, 60]);
    
    // Start yellow card animation
    Animated.parallel([
      // Pulse scale animation
      Animated.sequence([
        Animated.spring(yellowScaleAnim, {
          toValue: 1.05,
          tension: 80,
          friction: 4,
          useNativeDriver: false,
        }),
        Animated.spring(yellowScaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 4,
          useNativeDriver: false,
        }),
      ]),
      
      // Yellow background pulse
      Animated.sequence([
        Animated.timing(yellowBackgroundAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(yellowBackgroundAnim, {
          toValue: 0.5,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(yellowBackgroundAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(yellowBackgroundAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
      
      // Ripple effect
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]),
      
      // Glow effect
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
      
      // Rotation shake
      Animated.sequence([
        Animated.timing(yellowRotateAnim, {
          toValue: 1,
          duration: 40,
          useNativeDriver: false,
        }),
        Animated.timing(yellowRotateAnim, {
          toValue: -1,
          duration: 40,
          useNativeDriver: false,
        }),
        Animated.timing(yellowRotateAnim, {
          toValue: 0.5,
          duration: 40,
          useNativeDriver: false,
        }),
        Animated.timing(yellowRotateAnim, {
          toValue: -0.5,
          duration: 40,
          useNativeDriver: false,
        }),
        Animated.timing(yellowRotateAnim, {
          toValue: 0,
          duration: 40,
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      // Update status after animation
      onStatusUpdate(item, "od");
      // Reset animations
      setTimeout(() => {
        yellowScaleAnim.setValue(1);
        yellowRotateAnim.setValue(0);
      }, 100);
    });
  };

  // Interpolations for yellow animation
  const yellowBackground = yellowBackgroundAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [COLORS.white, COLORS.yellowSoft, COLORS.yellow],
  });
  
  const yellowBorderColor = yellowBackgroundAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [COLORS.border, COLORS.yellow, COLORS.yellow],
  });
  
  const yellowShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.3, 0.1],
  });
  
  const rotateZ = yellowRotateAnim.interpolate({
    inputRange: [-1, -0.5, 0, 0.5, 1],
    outputRange: ['-3deg', '-1.5deg', '0deg', '1.5deg', '3deg'],
  });
  
  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });
  
  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.2, 0],
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [
            { scale: scaleAnim },
            { rotateZ: item.status === "od" ? rotateZ : '0deg' },
          ],
          backgroundColor: item.status === "od" ? yellowBackground : COLORS.white,
          borderColor: item.status === "od" ? yellowBorderColor : COLORS.border,
          borderWidth: item.status === "od" ? 2 : 1,
          shadowColor: COLORS.yellow,
          shadowOpacity: yellowShadowOpacity,
          shadowRadius: 12,
          elevation: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 6],
          }),
        },
      ]}
    >
      {/* Ripple Effect */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 100,
          height: 100,
          marginLeft: -50,
          marginTop: -50,
          borderRadius: 50,
          backgroundColor: COLORS.yellow,
          transform: [{ scale: rippleScale }],
          opacity: rippleOpacity,
        }}
      />
      
      {/* Glow Overlay */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: COLORS.yellow,
          opacity: glowAnim.interpolate({
            inputRange: [0, 0.3, 0.6, 1],
            outputRange: [0, 0.1, 0.05, 0],
          }),
        }}
      />

      {/* Swipe Hint Overlays */}
      {item.status === "od" && (
        <>
          <Animated.View
            style={[
              styles.swipeHintLeft,
              {
                opacity: swipeLeftOpacity,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={28} color={COLORS.white} />
            <Text style={styles.swipeHintText}>Present</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.swipeHintRight,
              {
                opacity: swipeRightOpacity,
              },
            ]}
          >
            <Ionicons name="close-circle" size={28} color={COLORS.white} />
            <Text style={styles.swipeHintText}>Absent</Text>
          </Animated.View>
        </>
      )}

      {/* Main Content */}
      <Animated.View
        style={[
          styles.cardContent,
          {
            transform: [{ translateX: panX }],
          },
        ]}
        {...(item.status === "od" ? panResponder.panHandlers : {})}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={400}
          style={styles.pressableContent}
          android_ripple={{ color: COLORS.border, borderless: false }}
        >
          <View style={styles.leftSection}>
            <Animated.View style={[
              styles.avatar, 
              item.status === "od" && styles.avatarOD,
              {
                transform: [{ scale: yellowScaleAnim }],
                backgroundColor: item.status === "od" ? yellowBackgroundAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [COLORS.background, COLORS.yellowSoft, COLORS.yellow],
                }) : COLORS.background,
              }
            ]}>
              <Animated.Text style={[
                styles.avatarText, 
                item.status === "od" && styles.avatarTextOD,
                {
                  color: item.status === "od" ? yellowBackgroundAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [COLORS.text, COLORS.navy, COLORS.navy],
                  }) : COLORS.text,
                  transform: [{ scale: yellowScaleAnim }],
                }
              ]}>
                {initials}
              </Animated.Text>
              {item.status === "od" && (
                <Animated.View style={[
                  styles.odIcon,
                  {
                    transform: [{ scale: yellowScaleAnim }],
                    backgroundColor: yellowBackgroundAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [COLORS.white, COLORS.yellow, COLORS.yellow],
                    }),
                  }
                ]}>
                  <Ionicons name="ribbon" size={10} color={COLORS.navy} />
                </Animated.View>
              )}
            </Animated.View>
            <View style={styles.infoSection}>
              <Text style={styles.studentName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rollNumber}>Roll No: {item.rollNo || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <Animated.View style={[
              styles.statusBadge, 
              { 
                backgroundColor: statusColor === COLORS.green ? COLORS.greenSoft : statusColor === COLORS.yellow ? COLORS.yellowSoft : COLORS.redSoft,
                transform: [{ scale: yellowScaleAnim }],
              }
            ]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </Animated.View>
            
            <Pressable
              onPress={() => onCallPress(item)}
              style={styles.callButton}
              android_ripple={{ color: COLORS.border, borderless: true }}
            >
              <Ionicons name="call-outline" size={16} color={COLORS.muted} />
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================
export default function AttendanceScreen({ navigation, route }) {
  const { classItem } = route.params;
  
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [resetting, setResetting] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fabScale = useRef(new Animated.Value(1)).current;
  const modalY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    loadAttendance();
    joinClassRoom(classItem._id);

    const handleAttendanceUpdated = ({ studentId, status }) => {
      setStudents((prev) => prev.map(s => s._id === studentId ? { ...s, status } : s));
    };

    const handleAttendanceReset = () => {
      setStudents((prev) => prev.map(s => ({ ...s, status: "absent" })));
      Vibration.vibrate(50);
    };

    socket.on("attendanceUpdated", handleAttendanceUpdated);
    socket.on("attendanceReset", handleAttendanceReset);

    return () => {
      socket.off("attendanceUpdated", handleAttendanceUpdated);
      socket.off("attendanceReset", handleAttendanceReset);
    };
  }, []);

  useEffect(() => {
    if (actionSheetVisible) {
      Animated.spring(modalY, {
        toValue: 0,
        useNativeDriver: false,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(modalY, {
        toValue: height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [actionSheetVisible]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/classes/${classItem._id}/students`);
      setStudents(response.data.data || []);
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter(s => s.status === "present").length;
    const od = students.filter(s => s.status === "od").length;
    const absent = students.filter(s => s.status === "absent").length;
    const progress = total > 0 ? ((present + od) / total) * 100 : 0;
    return { total, present, od, absent, progress };
  }, [students]);

  const filteredStudents = useMemo(() => {
    let filtered = students;
    
    if (activeTab !== "All") {
      filtered = filtered.filter(s => s.status === activeTab.toLowerCase());
    }
    
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) || 
        String(s.rollNo).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [students, activeTab, search]);

  const updateStatus = async (student, status) => {
    try {
      setUpdatingId(student._id);
      setStudents(prev => prev.map(s => s._id === student._id ? { ...s, status } : s));
      await api.patch(`/api/students/${student._id}/status`, { status });
      Vibration.vibrate(15);
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
      loadAttendance();
    } finally {
      setUpdatingId("");
    }
  };

  const resetAttendance = async () => {
    try {
      setResetting(true);
      await api.post(`/api/classes/${classItem._id}/reset`);
      setStudents(prev => prev.map(s => ({ ...s, status: "absent" })));
      Vibration.vibrate(100);
      Alert.alert("Success", "Attendance has been reset");
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setResetting(false);
    }
  };

  const confirmReset = () => {
    Alert.alert(
      "Reset Attendance",
      "This will mark all students as absent. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetAttendance }
      ]
    );
  };

  const copyList = async (status, label) => {
    const filtered = students.filter(s => s.status === status);
    const text = filtered.length 
      ? filtered.map(s => `${s.rollNo} - ${s.name}`).join("\n")
      : `No ${label.toLowerCase()} students found`;
    await Clipboard.setStringAsync(text);
    setActionSheetVisible(false);
    Alert.alert("Copied!", `${label} list copied to clipboard`);
  };

  const copyFullReport = async () => {
    try {
      const response = await api.get(`/api/classes/${classItem._id}/report`);
      await Clipboard.setStringAsync(response.data.data.reportText || "");
      setActionSheetVisible(false);
      Alert.alert("Copied!", "Full report copied to clipboard");
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    }
  };

  const shareToWhatsApp = () => {
    const message = `📊 *Attendance Report*\n📍 ${classItem.name}\n\n✅ Present: ${stats.present}\n📋 On Duty: ${stats.od}\n❌ Absent: ${stats.absent}\n\n👥 Total: ${stats.total}\n📈 Rate: ${Math.round(stats.progress)}%`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    setActionSheetVisible(false);
  };

  const callStudent = (student) => {
    if (!student.phone) {
      Alert.alert("Error", "No phone number available");
      return;
    }
    Linking.openURL(`tel:${student.phone}`);
  };

  const handleFabPressIn = () => {
    Animated.spring(fabScale, {
      toValue: 0.9,
      useNativeDriver: false,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handleFabPressOut = () => {
    Animated.spring(fabScale, {
      toValue: 1,
      useNativeDriver: false,
      tension: 200,
      friction: 10,
    }).start();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.className} numberOfLines={1}>
            {classItem.name}
          </Text>
          <Text style={styles.studentCount}>
            {stats.total} Students
          </Text>
        </View>

        <Pressable
          onPress={confirmReset}
          style={styles.headerIconBtn}
          disabled={resetting}
        >
          {resetting ? (
            <ActivityIndicator size="small" color={COLORS.muted} />
          ) : (
            <Ionicons name="refresh-outline" size={22} color={COLORS.blue} />
          )}
        </Pressable>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.green }]}>{stats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.yellow }]}>{stats.od}</Text>
          <Text style={styles.statLabel}>On Duty</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.red }]}>{stats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Attendance Rate</Text>
          <Text style={styles.progressPercent}>{Math.round(stats.progress)}%</Text>
        </View>
       <View style={styles.progressBar}>
  <View
    style={[
      styles.progressFill,
      {
        width: `${stats.progress}%`,
      },
    ]}
  />
</View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or roll number..."
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search !== "" && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Student List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.navy} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <StudentCard
              item={item}
              updatingId={updatingId}
              onStatusUpdate={updateStatus}
              onCallPress={callStudent}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptyText}>
                {search ? "Try a different search term" : "No students in this class"}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <Pressable
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          onPress={() => setActionSheetVisible(true)}
          style={styles.fabButton}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={COLORS.white} />
        </Pressable>
      </Animated.View>

      {/* Action Sheet Modal */}
      <Modal transparent visible={actionSheetVisible} animationType="none">
        <Pressable style={styles.modalOverlay} onPress={() => setActionSheetVisible(false)}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalY }] }]}>
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>Export Options</Text>

            <Pressable onPress={copyFullReport} style={styles.modalItem}>
              <View style={styles.modalIcon}>
                <Ionicons name="copy-outline" size={18} color={COLORS.text} />
              </View>
              <Text style={styles.modalItemText}>Copy Full Report</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </Pressable>

            <Pressable onPress={() => copyList("present", "Present")} style={styles.modalItem}>
              <View style={styles.modalIcon}>
                <Ionicons name="checkmark" size={18} color={COLORS.green} />
              </View>
              <Text style={styles.modalItemText}>Copy Present List</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </Pressable>

            <Pressable onPress={() => copyList("od", "On Duty")} style={styles.modalItem}>
              <View style={styles.modalIcon}>
                <Ionicons name="ribbon-outline" size={18} color={COLORS.yellow} />
              </View>
              <Text style={styles.modalItemText}>Copy On Duty List</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </Pressable>

            <Pressable onPress={() => copyList("absent", "Absent")} style={styles.modalItem}>
              <View style={styles.modalIcon}>
                <Ionicons name="close" size={18} color={COLORS.red} />
              </View>
              <Text style={styles.modalItemText}>Copy Absent List</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </Pressable>

            <View style={styles.modalDivider} />

            <Pressable onPress={shareToWhatsApp} style={styles.modalItem}>
              <View style={styles.modalIcon}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              </View>
              <Text style={styles.modalItemText}>Share via WhatsApp</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </Pressable>

            <Pressable onPress={() => setActionSheetVisible(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  studentCount: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
progressPercent: {
  fontSize: 13,
  fontWeight: "700",
  color: "#1D4ED8",
},

progressFill: {
  height: "100%",
  borderRadius: 999,
  backgroundColor: "#1D4ED8",
},
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 10,
  },
  cardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardContent: {
    width: '100%',
  },
  pressableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarOD: {
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  avatarTextOD: {
    fontWeight: '700',
  },
  odIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.yellow,
  },
  infoSection: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  rollNumber: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  callButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  swipeHintLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: COLORS.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  swipeHintRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: COLORS.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  swipeHintText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.navy,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalItemText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.muted,
  },
});