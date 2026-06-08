import React, { useRef, useEffect } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "@/contexts/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { bestImage, toTrack, type SaavnSong } from "@/lib/saavn";

type Props = {
  song: SaavnSong;
  queue: SaavnSong[];
  quality: string;
};

export function SongRow({ song, queue, quality }: Props) {
  const { play, current, isPlaying } = usePlayer();
  const colors = useColors();
  const isActive = current?.id === song.id;

  const img = bestImage(song.image);
  const artist = song.artists?.primary?.[0]?.name ?? "Unknown";
  const dur = formatDuration(Number(song.duration) || 0);

  function formatDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <Pressable
      onPress={() => void play(queue.map((s) => toTrack(s, quality)), queue.indexOf(song))}
      style={styles.row}
    >
      {/* Thumbnail */}
      {img ? (
        <Image source={{ uri: img }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Ionicons name="musical-note" size={20} color="#555" />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.title, { color: isActive ? colors.accent : "#fff" }]}
          numberOfLines={1}
        >
          {song.name}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
      </View>

      {/* Duration */}
      <Text style={styles.duration}>{dur}</Text>

      {/* Play button */}
      <View style={[styles.playCircle, isActive && { borderColor: colors.accent }]}>
        {isActive && isPlaying ? (
          <EqualizerBars accent={colors.accent} />
        ) : (
          <Ionicons
            name="play"
            size={13}
            color={isActive ? colors.accent : "#fff"}
            style={{ marginLeft: 2 }}
          />
        )}
      </View>
    </Pressable>
  );
}

function EqualizerBars({ accent }: { accent: string }) {
  const b0 = useRef(new Animated.Value(0.4)).current;
  const b1 = useRef(new Animated.Value(0.8)).current;
  const b2 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anims = [b0, b1, b2].map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(b, { toValue: 1, duration: 380 + i * 90, useNativeDriver: true }),
          Animated.timing(b, { toValue: 0.3, duration: 380 + i * 90, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.eqWrap}>
      {[b0, b1, b2].map((b, i) => (
        <Animated.View
          key={i}
          style={[styles.eqBar, { backgroundColor: accent, transform: [{ scaleY: b }] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 9,
    gap: 14,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbFallback: {
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600", marginBottom: 3 },
  artist: { fontSize: 13, color: "#888" },
  duration: { fontSize: 13, color: "#888", marginRight: 2 },
  playCircle: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  eqWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
  eqBar: { width: 3, height: 12, borderRadius: 1.5 },
});
