import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { SongRow } from "@/components/SongRow";
import { Saavn, bestImage, toTrack, type SaavnAlbum, type SaavnArtist, type SaavnSong } from "@/lib/saavn";
import { saveRecentSearch, getRecentSearches, removeRecentSearch } from "@/lib/storage";

const { width: SW } = Dimensions.get("window");

const GENRES = [
  { label: "Pop", color: "#1a1a2e" },
  { label: "Hip-Hop", color: "#1a1a2e" },
  { label: "Rock", color: "#1a1a2e" },
  { label: "R&B", color: "#1a1a2e" },
  { label: "K-Pop", color: "#1a1a2e" },
  { label: "Electronic", color: "#1a1a2e" },
  { label: "Devotional", color: "#1a1a2e" },
  { label: "Punjabi", color: "#1a1a2e" },
  { label: "Lo-fi", color: "#1a1a2e" },
  { label: "Classical", color: "#1a1a2e" },
];

type Results = { songs: SaavnSong[]; albums: SaavnAlbum[]; artists: SaavnArtist[] };

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { quality } = useTheme();
  const { play } = usePlayer();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    getRecentSearches().then(setRecents);
  }, []);

  function handleChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults(null); return; }
    debounceRef.current = setTimeout(() => void doSearch(text), 420);
  }

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const [sRes, aRes, arRes] = await Promise.all([
        Saavn.searchSongs(q, 20),
        Saavn.searchAlbums(q, 8),
        Saavn.searchArtists(q, 6),
      ]);
      setResults({
        songs: sRes.results ?? [],
        albums: aRes.results ?? [],
        artists: arRes.results ?? [],
      });
      await saveRecentSearch(q);
      setRecents(await getRecentSearches());
    } catch {
      setResults({ songs: [], albums: [], artists: [] });
    } finally {
      setLoading(false);
    }
  }

  async function tapGenre(label: string) {
    setQuery(label);
    void doSearch(label);
  }

  async function tapRecent(r: string) {
    setQuery(r);
    void doSearch(r);
  }

  async function removeRecent(r: string) {
    await removeRecentSearch(r);
    setRecents(await getRecentSearches());
  }

  return (
    <View style={styles.container}>
      {/* Fixed header: title + search bar */}
      <View style={[styles.topSection, { paddingTop: topInset + 16 }]}>
        <Text style={styles.pageTitle}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#888" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleChange}
            placeholder="Songs, artists, albums..."
            placeholderTextColor="#555"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={() => query.trim() && void doSearch(query)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(""); setResults(null); }} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
      >
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        {/* Browse state — no active query */}
        {!query && !results && (
          <>
            {/* Recent searches */}
            {recents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>RECENT</Text>
                <View style={styles.recentsRow}>
                  {recents.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => tapRecent(r)}
                      style={styles.recentChip}
                    >
                      <Ionicons name="time-outline" size={14} color="#888" />
                      <Text style={styles.recentText}>{r}</Text>
                      <Pressable onPress={() => void removeRecent(r)} hitSlop={6}>
                        <Ionicons name="close" size={13} color="#666" />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Browse genres */}
            <View style={styles.section}>
              <Text style={styles.browseTitle}>Browse</Text>
              <View style={styles.genreGrid}>
                {GENRES.map((g) => (
                  <Pressable
                    key={g.label}
                    onPress={() => void tapGenre(g.label)}
                    style={styles.genreTile}
                  >
                    <Text style={styles.genreText}>{g.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            {/* Artists */}
            {results.artists.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.resultsSection}>Artists</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistScroll}>
                  {results.artists.map((a) => (
                    <Pressable key={a.id} onPress={() => router.push(`/artist/${a.id}`)} style={styles.artistCard}>
                      <View style={styles.artistAvatar}>
                        {bestImage(a.image) ? (
                          <Image source={{ uri: bestImage(a.image) }} style={styles.artistImg} />
                        ) : (
                          <Ionicons name="person" size={28} color="#555" />
                        )}
                      </View>
                      <Text style={styles.artistName} numberOfLines={1}>{a.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Albums */}
            {results.albums.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.resultsSection}>Albums</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumScroll}>
                  {results.albums.map((a) => (
                    <Pressable key={a.id} onPress={() => router.push(`/album/${a.id}`)} style={styles.albumCard}>
                      {bestImage(a.image) ? (
                        <Image source={{ uri: bestImage(a.image) }} style={styles.albumImg} />
                      ) : (
                        <View style={[styles.albumImg, { backgroundColor: "#1a1a1a" }]} />
                      )}
                      <Text style={styles.albumName} numberOfLines={1}>{a.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Songs */}
            {results.songs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.resultsSection}>Songs</Text>
                {results.songs.map((s) => (
                  <SongRow key={s.id} song={s} queue={results.songs} quality={quality} />
                ))}
              </View>
            )}

            {results.songs.length === 0 && results.albums.length === 0 && results.artists.length === 0 && (
              <View style={styles.center}>
                <Ionicons name="search-outline" size={44} color="#444" />
                <Text style={styles.noResult}>No results for "{query}"</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const TILE_W = (SW - 52) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topSection: { paddingHorizontal: 20, paddingBottom: 16 },
  pageTitle: { fontSize: 34, fontWeight: "900", color: "#fff", marginBottom: 16, letterSpacing: -0.5 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 16, color: "#fff", padding: 0 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#888", letterSpacing: 1.2, marginBottom: 12 },
  recentsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 7,
  },
  recentText: { fontSize: 14, color: "#ddd" },
  browseTitle: { fontSize: 24, fontWeight: "900", color: "#fff", marginBottom: 16, letterSpacing: -0.3 },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  genreTile: {
    width: TILE_W,
    height: 78,
    backgroundColor: "#111",
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  genreText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  resultsSection: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 14 },
  artistScroll: { gap: 16 },
  artistCard: { alignItems: "center", width: 76 },
  artistAvatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: "#1a1a1a",
    overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  artistImg: { width: "100%", height: "100%" },
  artistName: { fontSize: 12, color: "#ccc", marginTop: 6, textAlign: "center" },
  albumScroll: { gap: 12 },
  albumCard: { width: 130 },
  albumImg: { width: 130, height: 130, borderRadius: 10, marginBottom: 6 },
  albumName: { fontSize: 12, color: "#ccc" },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  noResult: { fontSize: 15, color: "#555" },
});
