import React from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { FullPlayer } from "@/components/FullPlayer";

export default function PlayerScreen() {
  return (
    <View style={styles.container}>
      <FullPlayer onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
});
