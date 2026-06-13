import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
   </SafeAreaProvider>
  );
}
