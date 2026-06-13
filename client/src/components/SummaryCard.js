import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/config";

export default function SummaryCard({ label, value, color, softColor }) {
  return (
    <View style={[styles.card, { backgroundColor: softColor || COLORS.white }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 72,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10
  },
  label: {
    fontSize: 12,
    fontWeight: "800"
  },
  value: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "900"
  }
});
