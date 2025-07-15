import { useEffect } from "react";
import { Alert, Linking } from "react-native";
export default function CameraPermissionAlert() {
  useEffect(() => {
    Alert.alert("camera permission needed", "enable to continue", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Open Settings",
        onPress: () => {
          Linking.openSettings();
        },
      },
    ]);
  }, []);
  return null;
}
