import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePlayer } from "@/contexts/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { BlurView } from "expo-blur";

export function MiniPlayer() {
  const { current, isPlaying, toggle, next } = usePlayer();
  const colors = useColors();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (current) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 12 }).start();
    }
  }, [!!current]);

  useEffect(() => {
    if (isPlaying) {
      loopRef.current = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 22000, useNativeDriver: true })
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
    }
    return () => loopRef.current?.stop();
  }, [isPlaying]);

  if (!current) return null;

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const containerContent = (
    <Pressable
      onPress={() => router.push("/player")}
      style={styles.inner}
    >
      {/* Spinning disc */}
      <Animated.View style={[styles.disc, { transform: [{ rotate: spin }] }]}>
        <View style={[styles.discRing, { borderColor: colors.accent + "40" }]}>
          {current.cover ? (
            <Image source={{ uri: current.cover }} style={styles.discImg} />
          ) : (
            <View style={[styles.discImg, { backgroundColor: colors.secondary }]} />
          )}
        </View>
      </Animated.View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {current.title}
        </Text>
        <Text style={[styles.artist, { color: colors.mutedForeground }]} numberOfLines={1}>
          {current.artist}
        </Text>
      </View>

      {/* Controls */}
      <Pressable
        onPress={(e) => { e.stopPropagation(); void toggle(); }}
        style={[styles.ctrlBtn, { backgroundColor: colors.accent }]}
        hitSlop={8}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={18}
          color={colors.accentForeground}
          style={isPlaying ? undefined : { marginLeft: 2 }}
        />
      </Pressable>
      <Pressable
        onPress={(e) => { e.stopPropagation(); void next(); }}
        style={styles.nextBtn}
        hitSlop={8}
      >
        <Ionicons name="play-skip-forward" size={20} color={colors.foreground} />
      </Pressable>
    </Pressable>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
        Platform.OS !== "ios" && { backgroundColor: colors.card },
      ]}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      {containerContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 0,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  disc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  discRing: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 2,
    overflow: "hidden",
  },
  discImg: {
    flex: 1,
    borderRadius: 20,
  },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: "600" },
  artist: { fontSize: 11 },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
