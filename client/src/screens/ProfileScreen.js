import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  navy: "#061F3F",
  blue: "#0D6EFD",
  text: "#0F1E3A",
  muted: "#7A879B",
  border: "#DFE6F0",
  background: "#F6F8FC",
  white: "#FFFFFF",
  red: "#EF3E46",
};

export default function ProfileScreen({ navigation }) {
  const user = {
    name: "Thamilarasan GP",
    email: "thamilarasan@gmail.com",
    role: "Faculty",
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive" }
      ]
    );
  };

  const MenuItem = ({ icon, title, color = COLORS.text, onPress }) => (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color={color} />
        </View>

        <Text style={[styles.menuTitle, { color }]}>
          {title}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={COLORS.muted}
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0)}
            </Text>
          </View>

          <Text style={styles.name}>
            {user.name}
          </Text>

          <Text style={styles.email}>
            {user.email}
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role}
            </Text>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Account
          </Text>

          <MenuItem
            icon="person-outline"
            title="Edit Profile"
          />

          <MenuItem
            icon="lock-closed-outline"
            title="Change Password"
          />

          <MenuItem
            icon="notifications-outline"
            title="Notifications"
          />

          <MenuItem
            icon="shield-outline"
            title="Admin Panel"
            onPress={() => navigation.navigate("AdminLogin")}
          />
        </View>

        {/* App */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            App
          </Text>

          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
          />

          <MenuItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
          />

          <MenuItem
            icon="document-text-outline"
            title="Terms & Conditions"
          />
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <MenuItem
            icon="log-out-outline"
            title="Logout"
            color={COLORS.red}
            onPress={handleLogout}
          />
        </View>

        <Text style={styles.version}>
          Attendance System v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.navy,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "700",
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 14,
  },

  email: {
    color: COLORS.muted,
    marginTop: 4,
  },

  roleBadge: {
    marginTop: 12,
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  roleText: {
    color: COLORS.blue,
    fontWeight: "600",
  },

  section: {
    marginTop: 20,
    backgroundColor: COLORS.white,
    paddingVertical: 8,
  },

  sectionTitle: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
  },

  menuItem: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: "500",
  },

  version: {
    textAlign: "center",
    color: COLORS.muted,
    marginVertical: 30,
  },
});