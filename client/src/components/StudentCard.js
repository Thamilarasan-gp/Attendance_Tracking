import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/config";

const statusTheme = {
  present: [COLORS.green, COLORS.greenSoft, "Present"],
  od: [COLORS.yellow, COLORS.yellowSoft, "OD"],
  absent: [COLORS.red, COLORS.redSoft, "Absent"]
};

export default function StudentCard({
  student,
  onPress,
  onEdit,
  onDelete,
  onCall,
  showActions = false,
  showStatus = false,
  disabled = false
}) {
  const status = student.status || "absent";
  const [color, soft, label] = statusTheme[status] || statusTheme.absent;
  const initial = (student.name || student.rollNo || "?").charAt(0).toUpperCase();

  return (
    <Pressable
      style={[styles.card, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.avatar, { backgroundColor: soft }]}>
        <Text style={[styles.avatarText, { color }]}>{initial}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.rollNo}>{student.rollNo}</Text>
        <Text style={styles.name}>{student.name}</Text>
        {!!student.phone && <Text style={styles.phone}>{student.phone}</Text>}
      </View>

      {showStatus && (
        <View style={[styles.status, { backgroundColor: soft }]}>
          <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
      )}

      {showActions && (
        <View style={styles.actions}>
          <Pressable style={styles.iconButton} onPress={onEdit}>
            <Ionicons name="create-outline" size={17} color={COLORS.blue} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onDelete}>
            <Ionicons name="trash-outline" size={17} color={COLORS.red} />
          </Pressable>
        </View>
      )}

      {onCall && (
        <Pressable style={styles.callButton} onPress={onCall}>
          <Ionicons name="call-outline" size={17} color={COLORS.blue} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 2
  },
  disabled: {
    opacity: 0.65
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "900"
  },
  content: {
    flex: 1,
    marginLeft: 12
  },
  rollNo: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900"
  },
  name: {
    marginTop: 2,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600"
  },
  phone: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600"
  },
  status: {
    minWidth: 72,
    minHeight: 30,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900"
  },
  actions: {
    flexDirection: "row",
    gap: 6
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.blueSoft
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  }
});
