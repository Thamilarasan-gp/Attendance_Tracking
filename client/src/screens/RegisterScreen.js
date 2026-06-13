import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
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
        password,
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
      {/* Background Decorative Shapes from image_ec2383.png */}
      <View style={styles.shapeOne} />
      <View style={styles.shapeTwo} />

      {/* Top Blue Header Block */}
      <View style={styles.headerSection}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </Pressable>

        <View style={styles.logoBox}>
          <Ionicons name="clipboard" size={34} color={COLORS.blue || "#0D4DB8"} />
        </View>
      </View>

      {/* Bottom White Card (Covers Full Bottom) */}
      <View style={styles.formCard}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start managing placement attendance</Text>

        <Text style={styles.label}>Name</Text>
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

        <Text style={styles.label}>Email</Text>
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

        <Text style={styles.label}>Password</Text>
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
          <Text style={styles.link}>
            Already have an account?{" "}
            <Text style={styles.loginHighlight}>Login</Text>
          </Text>
        </Pressable>

        {/* Custom Footer with Heart Icon matching LoginScreen */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Build and crafted with{" "}
            <Ionicons name="heart" size={12} color="#EF4444" /> by{" "}
            <Text style={styles.footerAuthor}>Thamilarasan GP</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navyDark, 
    overflow: "hidden",
  },
  shapeOne: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#7EAFFF",
    opacity: 0.3,
    right: -150,
    top: -50,
  },
  shapeTwo: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#9CC0FF",
    opacity: 0.25,
    left: -100,
    bottom: -50,
    zIndex: 1,
  },
  headerSection: {
    flex: 0.28, 
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  back: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  formCard: {
    flex: 0.72, 
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 50, 
    paddingHorizontal: 30,
    paddingTop: 35,
    paddingBottom: 20,
    zIndex: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 25,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  inputWrap: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
  },
  button: {
    height: 55,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
  link: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 22,
    fontSize: 13,
    fontWeight: "700",
  },
  loginHighlight: {
    color: COLORS.blue,
    fontWeight: "900",
  },
  footerContainer: {
    marginTop: "auto", 
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#A0A0A0",
    fontWeight: "500",
    textAlign: "center",
  },
  footerAuthor: {
    color: "#666",
    fontWeight: "700",
  },
});