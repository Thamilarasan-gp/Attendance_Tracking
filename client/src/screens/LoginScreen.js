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

export default function LoginScreen({ navigation, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Details", "Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      });
      await onAuth(response.data.data);
    } catch (error) {
      Alert.alert("Login Failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Handler for social media clicks
  const handleSocialPress = (platformName) => {
    Alert.alert("Feature Coming Soon", `${platformName} login is under working progress.`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Background Decorative Shapes */}
      <View style={styles.shapeOne} />
      <View style={styles.shapeTwo} />

      {/* Top Blue Header Block */}
      <View style={styles.headerSection}>
        <View style={styles.logoBox}>
          <Ionicons name="clipboard" size={34} color="#0D4DB8" />
        </View>
      </View>

      {/* Bottom White Card (Covers Full Bottom half) */}
      <View style={styles.formCard}>
        <Text style={styles.title}>LogIn</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="login@abcd.com"
          placeholderTextColor="#B0B0B0"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#B0B0B0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>Login</Text>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>Or</Text>
          <View style={styles.line} />
        </View>

        {/* Social Buttons with Alert Functionality */}
        <View style={styles.socialRow}>
          <Pressable 
            style={styles.socialBtn} 
            onPress={() => handleSocialPress("Google")}
          >
            <Ionicons name="logo-google" size={24} color="#EA4335" />
          </Pressable>

          <Pressable 
            style={styles.socialBtn} 
            onPress={() => handleSocialPress("Twitter")}
          >
            <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
          </Pressable>

          <Pressable 
            style={styles.socialBtn} 
            onPress={() => handleSocialPress("Facebook")}
          >
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.bottomText}>
            Don't Have Any Account?{" "}
            <Text style={styles.signupText}>Sign Up</Text>
          </Text>
        </Pressable>

        {/* Custom Footer with Heart Icon */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Build and crafted with{" "}
            <Ionicons name="heart" size={12} color="#EF4444" /> by{" "}
            <Text style={styles.footerAuthor}>Thamilarasangp_IT</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D4DB8",
    overflow: "hidden",
  },
  shapeOne: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#7EAFFF",
    opacity: 0.4,
    right: -150,
    top: -50,
  },
  shapeTwo: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#9CC0FF",
    opacity: 0.35,
    left: -100,
    bottom: -50,
    zIndex: 1,
  },
  headerSection: {
    flex: 0.28, 
    justifyContent: "center",
    alignItems: "center",
  },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  formCard: {
    flex: 0.72, 
    backgroundColor: "#fff",
    borderTopLeftRadius: 50, 
    paddingHorizontal: 30,
    paddingTop: 35,
    paddingBottom: 20,
    zIndex: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#222",
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#222",
    marginBottom: 16,
  },
  loginButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#0D4DB8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  orText: {
    marginHorizontal: 12,
    color: "#777",
    fontSize: 14,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#EFF4FF", 
    justifyContent: "center",
    alignItems: "center",
  },
  bottomText: {
    textAlign: "center",
    marginTop: 22,
    fontSize: 14,
    color: "#777",
  },
  signupText: {
    color: "#0D4DB8",
    fontWeight: "700",
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