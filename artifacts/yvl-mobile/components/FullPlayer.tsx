import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { LyricsView } from "./LyricsView";
import { fetchLyrics, type Lyrics } from "@/lib/lrclib";
import { formatTime } from "@/lib/saavn";
import { addToDownloads, saveDownloadUri, isLiked, toggleLike, type StoredTrack } from "@/lib/storage";

const { width: SW } = Dimensions.get("window");
const DISC_SIZE = Math.min(SW * 0.78, 320);

export function FullPlayer({ onClose }: { onClose: () => void }) {
  const { current, isPlaying, toggle, next, prev, position, duration, seek } = usePlayer();
  const { lyricsMode } = useTheme();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<Lyrics>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const likeScale = useRef(new Animated.Value(1)).current;
  const prevTrackId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!current) return;
    if (current.id !== prevTrackId.current) {
      setLyrics(null);
      setDownloaded(false);
      prevTrackId.current = current.id;
    }
    isLiked(current.id).then(setLiked);
  }, [current?.id]);

  // Disc spin
  useEffect(() => {
    if (isPlaying) {
      loopRef.current = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
    }
    return () => loopRef.current?.stop();
  }, [isPlaying]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  useEffect(() => {
    if (!showLyrics || !current || lyrics) return;
    setLyricsLoading(true);
    fetchLyrics(current.title, current.artist, current.duration)
      .then(setLyrics)
      .finally(() => setLyricsLoading(false));
  }, [showLyrics, current?.id]);

  const handleLike = useCallback(async () => {
    if (!current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.4, useNativeDriver: true, speed: 100 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 60 }),
    ]).start();
    const track: StoredTrack = {
      id: current.id, title: current.title, artist: current.artist,
      cover: current.cover, duration: current.duration,
      albumId: current.albumId, albumName: current.albumName,
    };
    const nowLiked = await toggleLike(track);
    setLiked(nowLiked);
  }, [current]);

  const handleDownload = useCallback(async () => {
    if (!current?.stream || downloading || downloaded) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDownloading(true);
    try {
      const safeTitle = current.title.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docDir: string = (FileSystem as any).documentDirectory ?? "";
      const dest = `${docDir}yvl_${current.id}_${safeTitle}.mp3`;
      const dl = await FileSystem.downloadAsync(current.stream, dest);
      if (dl.status === 200) {
        await saveDownloadUri(current.id, dl.uri);
        const track: StoredTrack = {
          id: current.id, title: current.title, artist: current.artist,
          cover: current.cover, duration: current.duration,
          albumId: current.albumId, albumName: current.albumName,
        };
        await addToDownloads(track);
        setDownloaded(true);
      }
    } catch { /* download failed */ } finally {
      setDownloading(false);
    }
  }, [current, downloading, downloaded]);

  const pct = duration > 0 ? Math.min(1, position / duration) : 0;
  if (!current) return null;

  const topPad = Platform.OS === "web" ? 67 : insets.top + 12;
  const botPad = insets.bottom + 8;

  return (
    <View style={[styles.container, { paddingBottom: botPad }]}>
      {/* Blurred bg */}
      {current.cover && (
        <Image source={{ uri: current.cover }} style={StyleSheet.absoluteFill} blurRadius={42} />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.78)" }]} />

      {/* Header */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.topBtn}>
          <Ionicons name="chevron-down" size={26} color="#fff" />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
          <Text style={styles.nowPlayingApp}>YVL</Text>
        </View>
        <Pressable onPress={() => setShowLyrics(!showLyrics)} hitSlop={12} style={styles.topBtn}>
          <Ionicons name={showLyrics ? "musical-notes-outline" : "list-outline"} size={24} color="#fff" />
        </Pressable>
      </View>

      {showLyrics ? (
        /* ── LYRICS VIEW ── */
        <View style={styles.lyricsArea}>
          {lyricsLoading ? (
            <View style={styles.center}>
              <Text style={{ color: "#666" }}>Loading lyrics…</Text>
            </View>
          ) : (
            <LyricsView
              lines={lyrics?.synced ?? []}
              position={position}
              mode={lyricsMode}
              plain={lyrics?.plain}
            />
          )}
        </View>
      ) : (
        /* ── PLAYER VIEW ── */
        <View style={styles.playerArea}>
          {/* Vinyl disc */}
          <View style={styles.discOuter}>
            <Animated.View
              style={[
                styles.disc,
                { width: DISC_SIZE, height: DISC_SIZE, borderRadius: DISC_SIZE / 2 },
                { transform: [{ rotate: spin }] },
              ]}
            >
              {/* Outer vinyl groove rings */}
              <View style={[styles.vinylGroove, { width: DISC_SIZE, height: DISC_SIZE, borderRadius: DISC_SIZE / 2, borderColor: "rgba(255,255,255,0.08)" }]} />
              <View style={[styles.vinylGroove, { width: DISC_SIZE * 0.85, height: DISC_SIZE * 0.85, borderRadius: DISC_SIZE * 0.85 / 2, borderColor: "rgba(255,255,255,0.06)" }]} />
              {/* Album art */}
              <View style={[styles.artWrap, { width: DISC_SIZE * 0.62, height: DISC_SIZE * 0.62, borderRadius: DISC_SIZE * 0.62 / 2 }]}>
                {current.cover ? (
                  <Image source={{ uri: current.cover }} style={styles.artImg} />
                ) : (
                  <View style={[styles.artImg, { backgroundColor: "#1a1a1a" }]} />
                )}
              </View>
              {/* Center hole */}
              <View style={[styles.centerHole, { backgroundColor: "#111", borderColor: "rgba(255,255,255,0.2)" }]} />
            </Animated.View>
            {/* Glow */}
            <View style={[styles.discGlow, { backgroundColor: colors.accent + "18", width: DISC_SIZE + 50, height: DISC_SIZE + 50, borderRadius: (DISC_SIZE + 50) / 2 }]} />
          </View>

          {/* Song info */}
          <View style={styles.infoRow}>
            <View style={styles.infoText}>
              <Text style={styles.trackTitle} numberOfLines={1}>{current.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{current.artist}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Pressable onPress={handleLike} style={styles.actionBtn} hitSlop={10}>
                <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? "#ef4444" : "#fff"} />
              </Pressable>
            </Animated.View>
            <Pressable style={styles.actionBtn} hitSlop={10}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={handleDownload} style={styles.actionBtn} hitSlop={10} disabled={downloading || downloaded}>
              <Ionicons
                name={downloaded ? "checkmark-circle" : downloading ? "hourglass-outline" : "download-outline"}
                size={22}
                color={downloaded ? colors.accent : "#fff"}
              />
            </Pressable>
          </View>

          {/* Progress */}
          <View style={styles.progressWrap}>
            <SeekBarComp pct={pct} duration={duration} position={position} onSeek={seek} accent={colors.accent} />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Transport */}
          <View style={styles.transport}>
            <Pressable onPress={() => void prev()} hitSlop={14}>
              <Ionicons name="play-skip-back" size={28} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => void toggle()}
              style={styles.playBtn}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={28}
                color="#000"
                style={isPlaying ? undefined : { marginLeft: 3 }}
              />
            </Pressable>
            <Pressable onPress={() => void next()} hitSlop={14}>
              <Ionicons name="play-skip-forward" size={28} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function SeekBarComp({ pct, duration, position, onSeek, accent }: {
  pct: number; duration: number; position: number;
  onSeek: (t: number) => Promise<void>; accent: string;
}) {
  const [w, setW] = useState(SW - 48);
  return (
    <Pressable
      onPress={(e) => { void onSeek(Math.max(0, Math.min(duration, (e.nativeEvent.locationX / w) * duration))); }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={styles.seekbar}
    >
      <View style={styles.seekTrack}>
        <View style={[styles.seekFill, { width: `${pct * 100}%`, backgroundColor: "#fff" }]} />
        <View style={[styles.seekThumb, { left: `${pct * 100}%`, backgroundColor: "#fff" }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  topCenter: { flex: 1, alignItems: "center" },
  nowPlayingLabel: { fontSize: 11, color: "#888", fontWeight: "600", letterSpacing: 1 },
  nowPlayingApp: { fontSize: 15, color: "#fff", fontWeight: "800" },
  lyricsArea: { flex: 1 },
  playerArea: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingHorizontal: 28, paddingBottom: 8 },
  discOuter: { alignItems: "center", justifyContent: "center", marginVertical: 4 },
  disc: { alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
  vinylGroove: { position: "absolute", borderWidth: 1 },
  artWrap: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  artImg: { width: "100%", height: "100%", borderRadius: 9999 },
  centerHole: { position: "absolute", width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  discGlow: { position: "absolute", opacity: 0.5 },
  infoRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoText: { flex: 1 },
  trackTitle: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.3 },
  trackArtist: { fontSize: 14, color: "#888", marginTop: 4 },
  actionsRow: { flexDirection: "row", width: "100%", justifyContent: "space-around", alignItems: "center" },
  actionBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  progressWrap: { width: "100%" },
  seekbar: { paddingVertical: 14 },
  seekTrack: { height: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, position: "relative" },
  seekFill: { height: "100%", borderRadius: 2 },
  seekThumb: { position: "absolute", top: -5, width: 13, height: 13, borderRadius: 6.5, marginLeft: -6.5 },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  timeText: { fontSize: 12, color: "#888" },
  transport: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 42, width: "100%", paddingBottom: 4 },
  playBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
