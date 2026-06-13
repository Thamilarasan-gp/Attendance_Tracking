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

export default function RegisterScreen({ navigation, onAuth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Name, email, and password are required.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password
      });
      await onAuth(response.data.data);
    } catch (error) {
      Alert.alert("Registration failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start managing placement attendance</Text>

        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
          />
        </View>

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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navyDark,
    justifyContent: "center",
    paddingHorizontal: 20
  },
  back: {
    position: "absolute",
    top: 58,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center"
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
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  subtitle: {
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
  }
});
