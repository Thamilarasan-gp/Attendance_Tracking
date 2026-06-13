import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/config";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="clipboard" size={34} color={COLORS.white} />
      </View>
      <Text style={styles.title}>Placement Attendance</Text>
      <Text style={styles.subtitle}>Take attendance quickly and accurately</Text>
      <ActivityIndicator color={COLORS.white} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22
  },
  title: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center"
  },
  subtitle: {
    marginTop: 10,
    color: "#D9E8FF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center"
  },
  loader: {
    marginTop: 26
  }
});
