import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  createPlaylist, deletePlaylist, getHistory, getPlaylists,
  getOrCreateDownloads, getOrCreateLiked,
  type Playlist, type StoredTrack,
} from "@/lib/storage";
import { toTrack, type SaavnSong } from "@/lib/saavn";

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { quality } = useTheme();
  const { play } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<StoredTrack[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const reload = useCallback(async () => {
    await Promise.all([getOrCreateDownloads(), getOrCreateLiked()]);
    const [pls, hist] = await Promise.all([getPlaylists(), getHistory()]);
    setPlaylists(pls);
    setHistory(hist);
    const likedPl = pls.find((p) => p.isLiked);
    setLikedCount(likedPl?.tracks.length ?? 0);
  }, []);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  async function handleCreate() {
    if (!newName.trim()) return;
    await createPlaylist(newName);
    setNewName("");
    setCreating(false);
    void reload();
  }

  async function handleDelete(id: string) {
    Alert.alert("Delete playlist?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deletePlaylist(id); void reload(); } },
    ]);
  }

  function playPlaylist(pl: Playlist) {
    if (!pl.tracks.length) return;
    const songs: SaavnSong[] = pl.tracks.map((t) => ({
      id: t.id, name: t.title, duration: t.duration,
      artists: { primary: [{ id: "", name: t.artist }] },
      image: t.cover ? [{ quality: "500x500", url: t.cover }] : [],
    }));
    void play(songs.map((s) => toTrack(s, quality)), 0);
  }

  const customPlaylists = playlists.filter((p) => !p.isDownloads && !p.isLiked);
  const likedPlaylist = playlists.find((p) => p.isLiked);
  const likedSongs = likedPlaylist?.tracks ?? [];

  const STATS = [
    { icon: "heart-outline" as const, label: "Liked", count: likedCount },
    { icon: "list-outline" as const, label: "Playlists", count: customPlaylists.length },
    { icon: "time-outline" as const, label: "Recent", count: history.length },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: "#000" }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={styles.pageTitle}>Library</Text>
        <Pressable
          onPress={() => setCreating(true)}
          style={[styles.addBtn, { backgroundColor: "#1a1a1a" }]}
          hitSlop={8}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* 3 stat tiles */}
      <View style={styles.tileRow}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.tile}>
            <View style={styles.tileIconWrap}>
              <Ionicons name={s.icon} size={24} color="#fff" />
            </View>
            <Text style={styles.tileLabel}>{s.label}</Text>
            <Text style={styles.tileCount}>{s.count}</Text>
          </View>
        ))}
      </View>

      {/* Create playlist */}
      {creating && (
        <View style={styles.createRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Playlist name"
            placeholderTextColor="#555"
            style={styles.createInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <Pressable onPress={handleCreate} style={[styles.createOk, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={18} color={colors.accentForeground} />
          </Pressable>
          <Pressable onPress={() => { setCreating(false); setNewName(""); }} hitSlop={8}>
            <Ionicons name="close" size={20} color="#666" />
          </Pressable>
        </View>
      )}

      {/* Playlists */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Playlists</Text>
        {customPlaylists.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No playlists yet. Tap + to create one.</Text>
          </View>
        )}
        {customPlaylists.map((pl) => (
          <View key={pl.id} style={styles.playlistRow}>
            <View style={styles.plIconWrap}>
              <Ionicons name="list-outline" size={22} color="#fff" />
            </View>
            <View style={styles.plInfo}>
              <Text style={styles.plName} numberOfLines={1}>{pl.name}</Text>
              <Text style={styles.plTracks}>{pl.tracks.length} tracks</Text>
            </View>
            <Pressable onPress={() => playPlaylist(pl)} hitSlop={8} style={styles.plAction}>
              <Ionicons name="play" size={16} color="#fff" style={{ marginLeft: 2 }} />
            </Pressable>
            <Pressable onPress={() => void handleDelete(pl.id)} hitSlop={8} style={styles.plAction}>
              <Ionicons name="trash-outline" size={16} color="#666" />
            </Pressable>
          </View>
        ))}
      </View>

      {/* Liked */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liked</Text>
        {likedSongs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Tap the heart on any track to save it here.{"\n"}Stored on this device.</Text>
          </View>
        ) : (
          likedSongs.map((t) => {
            const s: SaavnSong = {
              id: t.id, name: t.title, duration: t.duration,
              artists: { primary: [{ id: "", name: t.artist }] },
              image: t.cover ? [{ quality: "500x500", url: t.cover }] : [],
            };
            return (
              <Pressable
                key={t.id}
                onPress={() => void play([toTrack(s, quality)], 0)}
                style={styles.likedRow}
              >
                {t.cover ? (
                  <Image source={{ uri: t.cover }} style={styles.likedThumb} />
                ) : (
                  <View style={[styles.likedThumb, { backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" }]}>
                    <Ionicons name="musical-note" size={18} color="#555" />
                  </View>
                )}
                <View style={styles.likedInfo}>
                  <Text style={styles.likedTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.likedArtist} numberOfLines={1}>{t.artist}</Text>
                </View>
                <Ionicons name="heart" size={18} color="#ef4444" />
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  pageTitle: { fontSize: 34, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  tileRow: { flexDirection: "row", gap: 14, paddingHorizontal: 20, marginBottom: 32 },
  tile: {
    flex: 1, backgroundColor: "#111",
    borderRadius: 16, padding: 16,
    alignItems: "flex-start",
  },
  tileIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#222",
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  tileLabel: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 2 },
  tileCount: { fontSize: 13, color: "#888" },
  createRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: "#111", borderRadius: 14, padding: 12,
  },
  createInput: { flex: 1, fontSize: 15, color: "#fff" },
  createOk: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: "#fff", marginBottom: 16, letterSpacing: -0.3 },
  emptyCard: {
    backgroundColor: "#111",
    borderRadius: 14, padding: 20,
  },
  emptyText: { color: "#666", fontSize: 14, lineHeight: 22 },
  playlistRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#111", borderRadius: 14,
    padding: 14, marginBottom: 10, gap: 14,
  },
  plIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#222",
    alignItems: "center", justifyContent: "center",
  },
  plInfo: { flex: 1 },
  plName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  plTracks: { fontSize: 12, color: "#888", marginTop: 2 },
  plAction: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#222",
    alignItems: "center", justifyContent: "center",
  },
  likedRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, gap: 14,
  },
  likedThumb: { width: 50, height: 50, borderRadius: 8, overflow: "hidden" },
  likedInfo: { flex: 1 },
  likedTitle: { fontSize: 15, fontWeight: "600", color: "#fff" },
  likedArtist: { fontSize: 13, color: "#888", marginTop: 2 },
});
