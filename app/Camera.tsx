import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";

import "react-native-worklets-core";

import CameraPermissionAlert from "./CameraPermissionAlert";

export default function Cam() {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  if (!device) {
    return (
      <View style={styles.center}>
        <Text>loading camera...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text>camera permission is required.</Text>
        <CameraPermissionAlert />
      </View>
    );
  }

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    // console.log(`Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Text>camera</Text>
      <Camera
        style={[StyleSheet.absoluteFill]}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
