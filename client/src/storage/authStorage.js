import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "placement_attendance_user";

export const saveUser = async (user) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = async () => {
  const value = await AsyncStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
};

export const removeUser = async () => {
  await AsyncStorage.removeItem(USER_KEY);
};
