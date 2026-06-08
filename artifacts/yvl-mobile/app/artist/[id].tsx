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
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/ThemeContext";
import { SongRow } from "@/components/SongRow";
import { AlbumCard } from "@/components/AlbumCard";
import { Saavn, bestImage, type SaavnArtist } from "@/lib/saavn";

const { width: SW } = Dimensions.get("window");

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { quality } = useTheme();
  const [artist, setArtist] = useState<SaavnArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (!id) return;
    Saavn.artist(id).then(setArtist).finally(() => setLoading(false));
  }, [id]);

  const cover = bestImage(artist?.image);

  if (loading || !artist) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
        {/* Hero */}
        <View style={[styles.hero, { height: SW * 0.72 }]}>
          {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)", colors.background]}
            style={[StyleSheet.absoluteFill, { top: "40%" }]}
          />
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: topInset + 8 }]} hitSlop={8}>
            <View style={styles.backInner}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </View>
          </Pressable>
          <View style={styles.heroInfo}>
            <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
            {artist.followerCount ? (
              <Text style={styles.followers}>{(artist.followerCount / 1000).toFixed(0)}K followers</Text>
            ) : null}
          </View>
        </View>

        {/* Top Songs */}
        {(artist.topSongs ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Songs</Text>
            {(artist.topSongs ?? []).slice(0, 10).map((s) => (
              <SongRow key={s.id} song={s} queue={artist.topSongs ?? []} quality={quality} />
            ))}
          </View>
        )}

        {/* Albums */}
        {(artist.topAlbums ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Albums</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {(artist.topAlbums ?? []).map((a) => (
                <AlbumCard key={a.id} album={a} size={148} quality={quality} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { position: "relative", overflow: "hidden" },
  backBtn: { position: "absolute", left: 16, zIndex: 10 },
  backInner: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  heroInfo: { position: "absolute", bottom: 16, left: 20, right: 20 },
  artistName: { fontSize: 34, fontWeight: "800", color: "#fff", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },
  followers: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 20, fontWeight: "700", paddingHorizontal: 20, marginBottom: 12 },
  hScroll: { paddingHorizontal: 16, gap: 12 },
});
