import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import CreateClassScreen from "../screens/CreateClassScreen";
import StudentListScreen from "../screens/StudentListScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import AdminLoginScreen from "../screens/AdminLoginScreen";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import UserBreakdownScreen from "../screens/UserBreakdownScreen";
import UserTrackingScreen from "../screens/UserTrackingScreen";
import { getUser, removeUser, saveUser } from "../storage/authStorage";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = await getUser();
      setUser(storedUser);
      setLoading(false);
    };

    restoreSession();
  }, []);

  const handleAuth = async (nextUser) => {
    await saveUser(nextUser);
    setUser(nextUser);
  };

  const handleLogout = async () => {
    await removeUser();
    setUser(null);
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onAuth={handleAuth} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {(props) => <RegisterScreen {...props} onAuth={handleAuth} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard">
              {(props) => (
                <DashboardScreen
                  {...props}
                  user={user}
                  onLogout={handleLogout}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="CreateClass">
              {(props) => <CreateClassScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="StudentList" component={StudentListScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="UserBreakdown" component={UserBreakdownScreen} />
            <Stack.Screen name="UserTracking" component={UserTrackingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
