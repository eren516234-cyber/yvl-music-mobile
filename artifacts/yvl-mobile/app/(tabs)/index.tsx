import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { Saavn, bestImage, toTrack, type SaavnAlbum, type SaavnSong } from "@/lib/saavn";

const { width: SW } = Dimensions.get("window");

const CATEGORIES = ["For you", "Rock", "Hip-hop", "K-Pop", "Devotional", "Lo-fi", "Punjabi"];
const CAT_QUERIES: Record<string, string> = {
  "For you": "Bollywood 2024",
  "Rock": "rock hits",
  "Hip-hop": "hip hop songs",
  "K-Pop": "k-pop hits",
  "Devotional": "bhajan devotional",
  "Lo-fi": "lo-fi chill",
  "Punjabi": "Punjabi hits 2024",
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { quality } = useTheme();
  const { play } = usePlayer();
  const [activeCat, setActiveCat] = useState("For you");
  const [songs, setSongs] = useState<SaavnSong[]>([]);
  const [albums, setAlbums] = useState<SaavnAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const abortRef = useRef(false);

  async function loadHome(cat = activeCat) {
    setLoading(true);
    abortRef.current = false;
    try {
      const q = CAT_QUERIES[cat] ?? "Bollywood 2024";
      const [sRes, aRes] = await Promise.all([
        Saavn.searchSongs(q, 15),
        Saavn.searchAlbums(q, 12),
      ]);
      if (!abortRef.current) {
        setSongs(sRes.results ?? []);
        setAlbums(aRes.results ?? []);
      }
    } catch { /* network error */ } finally {
      if (!abortRef.current) { setLoading(false); setRefreshing(false); }
    }
  }

  useEffect(() => { void loadHome(); return () => { abortRef.current = true; }; }, []);

  function switchCat(cat: string) {
    setActiveCat(cat);
    void loadHome(cat);
  }

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  function formatDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: "#000" }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); void loadHome(); }}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={styles.brand}>YVL</Text>
        <Pressable onPress={() => router.push("/(tabs)/settings")} style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.accentForeground }]}>E</Text>
        </Pressable>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catScroll}
        style={{ marginBottom: 28 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => switchCat(cat)}
            style={[
              styles.catPill,
              activeCat === cat
                ? { backgroundColor: "#fff" }
                : { backgroundColor: "transparent" },
            ]}
          >
            <Text
              style={[
                styles.catText,
                { color: activeCat === cat ? "#000" : "#888" },
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <>
          {/* Quick picks */}
          {songs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick picks</Text>
              {songs.slice(0, 8).map((song) => {
                const imgUri = bestImage(song.image);
                const artist = song.artists?.primary?.[0]?.name ?? "Unknown";
                const dur = formatDuration(Number(song.duration) || 0);
                return (
                  <Pressable
                    key={song.id}
                    onPress={() => void play(songs.map((s) => toTrack(s, quality)), songs.indexOf(song))}
                    style={styles.songRow}
                  >
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={styles.songThumb} />
                    ) : (
                      <View style={[styles.songThumb, { backgroundColor: "#1a1a1a" }]}>
                        <Ionicons name="musical-note" size={22} color="#555" />
                      </View>
                    )}
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle} numberOfLines={1}>{song.name}</Text>
                      <Text style={styles.songArtist} numberOfLines={1}>{artist}</Text>
                    </View>
                    <Text style={styles.songDuration}>{dur}</Text>
                    <View style={styles.playCircle}>
                      <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 2 }} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Playlists */}
          {albums.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>
                  Playlists · {albums.length}
                </Text>
                <Pressable hitSlop={8}>
                  <Text style={[styles.seeMore, { color: "#888" }]}>See more</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.albumScroll}
              >
                {albums.map((album) => {
                  const uri = bestImage(album.image);
                  return (
                    <Pressable
                      key={album.id}
                      onPress={() => router.push(`/album/${album.id}`)}
                      style={styles.albumCard}
                    >
                      {uri ? (
                        <Image source={{ uri }} style={styles.albumImg} />
                      ) : (
                        <View style={[styles.albumImg, { backgroundColor: "#1a1a1a" }]} />
                      )}
                      <View style={styles.albumPlayBtn}>
                        <Ionicons name="play" size={16} color="#fff" style={{ marginLeft: 2 }} />
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const THUMB = 58;
const ALBUM_W = (SW - 48) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  brand: { fontSize: 42, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800" },
  catScroll: { paddingHorizontal: 16, gap: 10 },
  catPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
  },
  catText: { fontSize: 15, fontWeight: "600" },
  loader: { height: 280, alignItems: "center", justifyContent: "center" },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 22, fontWeight: "900", color: "#fff",
    paddingHorizontal: 20, marginBottom: 16, letterSpacing: -0.3,
  },
  sectionRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 20, marginBottom: 16,
  },
  seeMore: { fontSize: 15, fontWeight: "500" },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 14,
  },
  songThumb: {
    width: THUMB, height: THUMB,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 15, fontWeight: "600", color: "#fff", marginBottom: 3 },
  songArtist: { fontSize: 13, color: "#888" },
  songDuration: { fontSize: 13, color: "#888", marginRight: 4 },
  playCircle: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  albumScroll: { paddingHorizontal: 16, gap: 14 },
  albumCard: {
    width: ALBUM_W,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  albumImg: { width: ALBUM_W, height: ALBUM_W, borderRadius: 14 },
  albumPlayBtn: {
    position: "absolute",
    bottom: 12, right: 12,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center", justifyContent: "center",
  },
});
