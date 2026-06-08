import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePlayer } from "@/contexts/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { Saavn, bestImage, primaryArtist, toTrack, type SaavnAlbum } from "@/lib/saavn";

type Props = { album: SaavnAlbum; size?: number; quality?: string };

export function AlbumCard({ album, size = 160, quality = "320kbps" }: Props) {
  const { play } = usePlayer();
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const cover = bestImage(album.image);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  async function quickPlay() {
    if (loading) return;
    setLoading(true);
    try {
      let songs = album.songs;
      if (!songs?.length) {
        const full = await Saavn.album(album.id);
        songs = full.songs ?? [];
      }
      if (!songs?.length) return;
      await play(songs.map((s) => toTrack(s, quality)), 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      onPress={() => router.push(`/album/${album.id}`)}
      onPressIn={() =>
        Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()
      }
      onPressOut={() =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
      }
    >
      <Animated.View style={[{ width: size }, { transform: [{ scale: scaleAnim }] }]}>
        <View
          style={[
            styles.cover,
            { width: size, height: size, backgroundColor: colors.secondary },
          ]}
        >
          {cover && <Image source={{ uri: cover }} style={styles.img} />}
          <View style={styles.gradient} />
          <Pressable
            onPress={quickPlay}
            style={[styles.playBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons
              name={loading ? "hourglass-outline" : "play"}
              size={16}
              color={colors.accentForeground}
              style={loading ? undefined : { marginLeft: 2 }}
            />
          </Pressable>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {album.name}
        </Text>
        <Text style={[styles.artist, { color: colors.mutedForeground }]} numberOfLines={1}>
          {primaryArtist(album)}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: 8,
  },
  img: { ...StyleSheet.absoluteFillObject },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  artist: { fontSize: 12, marginTop: 2 },
});
