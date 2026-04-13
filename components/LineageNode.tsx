import React from "react";
import { View, Text } from "react-native";

// TODO: Props will include instructor address, student address, lineage depth, and belt color
interface LineageNodeProps {}

export default function LineageNode({}: LineageNodeProps) {
  return (
    <View>
      <Text>LineageNode</Text>
    </View>
  );
}
