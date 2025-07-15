import { Text, View } from "react-native";
import "react-native-worklets-core";
import Cam from "./Camera";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <Text>hello, world!</Text>
      <Text>yay!!!!</Text>
      <Cam />
    </View>
  );
}
