import {Text, View} from "react-native";
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
      <Text style={{textAlign: 'right'}}>you did it!</Text>
      <Cam />
    </View>
  );
}
