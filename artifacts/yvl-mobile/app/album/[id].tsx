import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { SongRow } from "@/components/SongRow";
import { Saavn, bestImage, primaryArtist, toTrack, type SaavnAlbum } from "@/lib/saavn";

const { width: SW } = Dimensions.get("window");

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { quality } = useTheme();
  const { play } = usePlayer();
  const [album, setAlbum] = useState<SaavnAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (!id) return;
    Saavn.album(id).then(setAlbum).finally(() => setLoading(false));
  }, [id]);

  const cover = bestImage(album?.image);

  if (loading || !album) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const songs = album.songs ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
        {/* Hero */}
        <View style={styles.hero}>
          {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} blurRadius={28} />}
          <LinearGradient
            colors={["transparent", colors.background]}
            style={[StyleSheet.absoluteFill, { top: SW * 0.4 }]}
          />
          <View style={[styles.heroBack, { top: topInset + 8 }]}>
            <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
          </View>
          {cover && (
            <Image
              source={{ uri: cover }}
              style={[styles.coverArt, { top: topInset + 52 }]}
            />
          )}
        </View>

        <View style={styles.info}>
          <Text style={[styles.albumName, { color: colors.foreground }]}>{album.name}</Text>
          <Text style={[styles.artistName, { color: colors.mutedForeground }]}>
            {primaryArtist(album)}{album.year ? ` · ${album.year}` : ""}
          </Text>
          <Text style={[styles.songCount, { color: colors.mutedForeground }]}>
            {songs.length} songs
          </Text>

          {songs.length > 0 && (
            <Pressable
              onPress={() => void play(songs.map((s) => toTrack(s, quality)), 0)}
              style={[styles.playAll, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="play" size={18} color={colors.accentForeground} style={{ marginLeft: 3 }} />
              <Text style={[styles.playAllText, { color: colors.accentForeground }]}>Play All</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.songs}>
          {songs.map((s) => (
            <SongRow key={s.id} song={s} queue={songs} quality={quality} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { width: SW, height: SW * 0.88, position: "relative", alignItems: "center" },
  heroBack: { position: "absolute", left: 16, zIndex: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  coverArt: { position: "absolute", width: SW * 0.62, height: SW * 0.62, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  info: { paddingHorizontal: 20, paddingTop: 16, gap: 4 },
  albumName: { fontSize: 26, fontWeight: "800" },
  artistName: { fontSize: 15 },
  songCount: { fontSize: 13, marginTop: 2 },
  playAll: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, marginTop: 12 },
  playAllText: { fontSize: 15, fontWeight: "700" },
  songs: { marginTop: 8 },
});
