import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api, { getErrorMessage } from "../services/api";
import { COLORS } from "../constants/config";

export default function LoginScreen({ navigation, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/api/auth/login", {
        email: email.trim(),
        password
      });
      await onAuth(response.data.data);
    } catch (error) {
      Alert.alert("Login failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.top}>
        <View style={styles.logo}>
          <Ionicons name="clipboard" size={34} color={COLORS.white} />
        </View>
        <Text style={styles.appTitle}>Placement Attendance</Text>
        <Text style={styles.tagline}>Take attendance quickly and accurately</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome Back</Text>
        <Text style={styles.cardSubtitle}>Please login to continue</Text>

        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>Create Account</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>© 2026 Placement Attendance</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navyDark,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30
  },
  top: {
    alignItems: "center",
    marginBottom: 42
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  appTitle: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center"
  },
  tagline: {
    marginTop: 10,
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 8
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  cardSubtitle: {
    marginTop: 8,
    marginBottom: 22,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  inputWrap: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 14
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 10
  },
  button: {
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900"
  },
  link: {
    color: COLORS.blue,
    textAlign: "center",
    marginTop: 18,
    fontSize: 13,
    fontWeight: "900"
  },
  footer: {
    marginTop: "auto",
    color: "#A8B8CF",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600"
  }
});
