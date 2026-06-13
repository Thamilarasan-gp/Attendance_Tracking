import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/config";

const ACCENTS = [
  [COLORS.green, COLORS.greenSoft],
  ["#7C4DFF", "#F0EAFF"],
  ["#FF8A3D", "#FFF0E7"],
  ["#28A7A3", "#E6FAF8"],
  [COLORS.red, COLORS.redSoft]
];

export default function ClassCard({ item, index = 0, onPress, onLongPress }) {
  const [accent, soft] = ACCENTS[index % ACCENTS.length];

  return (
    <Pressable style={styles.card} onPress={onPress} onLongPress={onLongPress}>
      <View style={[styles.iconWrap, { backgroundColor: soft }]}>
        <Ionicons name="people" size={18} color={accent} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.studentCount || 0} Students</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 3
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    flex: 1,
    marginLeft: 14
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  subtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600"
  }
});
