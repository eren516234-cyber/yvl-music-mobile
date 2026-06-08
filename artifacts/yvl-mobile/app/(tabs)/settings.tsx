import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, PRESET_COLOURS } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";

const QUALITIES = [
  { label: "96 kbps", value: "96kbps" },
  { label: "160 kbps", value: "160kbps" },
  { label: "320 kbps", value: "320kbps" },
];

const LYRICS_MODES = [
  { label: "Apple Style", value: "ios" },
  { label: "Karaoke", value: "karaoke" },
  { label: "Word", value: "word" },
  { label: "Char", value: "char" },
  { label: "Fluid", value: "fluid" },
  { label: "Wave", value: "wave" },
  { label: "Neon", value: "neon" },
  { label: "Cinema", value: "cinema" },
  { label: "Float", value: "float" },
];

/** Compute black or white text based on accent luminance */
function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 0.5 ? "#000000" : "#ffffff";
}

function darkenHex(hex: string, amount = 0.12): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { accent, baseAccent, rainbow, quality, lyricsMode, perScreenColour,
    setAccent, setRainbow, setQuality, setLyricsMode, setPerScreenColour } = useTheme();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bg = accent;
  const fg = contrastText(bg);
  const cardBg = darkenHex(bg, 0.1);
  const mutedFg = fg + "99";

  const switchTrack = { false: cardBg, true: darkenHex(bg, 0.2) };
  const switchThumb = fg;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.pageTitle, { color: fg }]}>Settings</Text>
      </View>

      {/* ─── THEME ─── */}
      <Text style={[styles.sectionLabel, { color: mutedFg }]}>THEME</Text>

      {/* Rainbow Mode */}
      <View style={[styles.card, { backgroundColor: cardBg, marginBottom: 12 }]}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={[styles.cardTitle, { color: fg }]}>🌈  Rainbow Mode</Text>
            <Text style={[styles.cardDesc, { color: mutedFg }]}>Change the whole app's colour</Text>
          </View>
          <Switch
            value={rainbow}
            onValueChange={setRainbow}
            trackColor={switchTrack}
            thumbColor={switchThumb}
          />
        </View>
      </View>

      {/* Custom Colour */}
      <View style={[styles.card, { backgroundColor: cardBg, marginBottom: 12 }]}>
        <Text style={[styles.cardTitle, { color: fg, marginBottom: 14 }]}>✏️  Custom Colour</Text>
        <View style={styles.colourGrid}>
          {PRESET_COLOURS.map((c) => {
            const isSelected = baseAccent === c.hex && !rainbow;
            return (
              <Pressable
                key={c.hex}
                onPress={() => setAccent(c.hex)}
                style={[
                  styles.colourDot,
                  { backgroundColor: c.hex },
                  isSelected && styles.colourDotSelected,
                ]}
              >
                {isSelected && (
                  <Text style={{ color: contrastText(c.hex), fontSize: 16, fontWeight: "900" }}>✓</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Per-Screen Colour */}
      <View style={[styles.card, { backgroundColor: cardBg, marginBottom: 12 }]}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={[styles.cardTitle, { color: fg }]}>🎨  Per-Screen Colour</Text>
            <Text style={[styles.cardDesc, { color: mutedFg }]}>Each screen has its own colour</Text>
          </View>
          <Switch
            value={perScreenColour}
            onValueChange={setPerScreenColour}
            trackColor={switchTrack}
            thumbColor={switchThumb}
          />
        </View>
      </View>

      {/* Reset */}
      <Pressable
        onPress={() => { setAccent("#ffffff"); setRainbow(false); }}
        style={[styles.resetBtn, { backgroundColor: cardBg, marginBottom: 28 }]}
      >
        <Text style={[styles.resetText, { color: fg }]}>Reset to Black &amp; White</Text>
      </Pressable>

      {/* ─── PLAYBACK ─── */}
      <Text style={[styles.sectionLabel, { color: mutedFg }]}>PLAYBACK</Text>

      {/* Audio Quality */}
      <View style={[styles.card, { backgroundColor: cardBg, marginBottom: 12 }]}>
        <Text style={[styles.cardTitle, { color: fg }]}>Audio Quality</Text>
        <Text style={[styles.cardDesc, { color: mutedFg, marginBottom: 16 }]}>Streamed from JioSaavn (Melo API)</Text>
        {QUALITIES.map((q, i) => (
          <Pressable
            key={q.value}
            onPress={() => setQuality(q.value)}
            style={[
              styles.qualityRow,
              i < QUALITIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: mutedFg + "30" },
            ]}
          >
            <Text style={[styles.qualityLabel, { color: fg }]}>{q.label}</Text>
            <View style={[styles.radioOuter, { borderColor: fg }]}>
              {quality === q.value && <View style={[styles.radioInner, { backgroundColor: fg }]} />}
            </View>
          </Pressable>
        ))}
      </View>

      {/* ─── LYRICS ─── */}
      <Text style={[styles.sectionLabel, { color: mutedFg }]}>LYRICS DISPLAY</Text>

      <View style={[styles.card, { backgroundColor: cardBg, marginBottom: 28 }]}>
        <View style={styles.modeGrid}>
          {LYRICS_MODES.map((m) => {
            const active = lyricsMode === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => setLyricsMode(m.value)}
                style={[
                  styles.modeChip,
                  {
                    backgroundColor: active ? fg + "30" : "transparent",
                    borderWidth: 1,
                    borderColor: active ? fg : fg + "30",
                  },
                ]}
              >
                <Text style={[styles.modeLabel, { color: active ? fg : mutedFg }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  pageTitle: { fontSize: 34, fontWeight: "900", letterSpacing: -0.5, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 10 },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardDesc: { fontSize: 13, marginTop: 3 },
  colourGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  colourDot: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  colourDotSelected: { borderWidth: 3, borderColor: "#000" },
  resetBtn: {
    marginHorizontal: 16,
    borderRadius: 14, padding: 16,
    alignItems: "center",
  },
  resetText: { fontSize: 15, fontWeight: "700" },
  qualityRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 13,
  },
  qualityLabel: { fontSize: 15, fontWeight: "600" },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  modeLabel: { fontSize: 13, fontWeight: "600" },
});
