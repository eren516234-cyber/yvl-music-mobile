import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { LyricsLine } from "@/lib/lrclib";

const { width: SW, height: SH } = Dimensions.get("window");

type Props = {
  lines: LyricsLine[];
  position: number;
  mode: string;
  plain?: string;
};

// Find the current active line index
function activeLine(lines: LyricsLine[], pos: number): number {
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= pos) idx = i;
    else break;
  }
  return idx;
}

export function LyricsView({ lines, position, mode, plain }: Props) {
  const colors = useColors();
  const active = activeLine(lines, position);

  if (!lines.length && !plain) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No lyrics available</Text>
      </View>
    );
  }

  if (!lines.length && plain) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.plainContent}>
        <Text style={[styles.plainText, { color: colors.foreground }]}>{plain}</Text>
      </ScrollView>
    );
  }

  switch (mode) {
    case "karaoke":   return <KaraokeMode lines={lines} active={active} colors={colors} position={position} />;
    case "word":      return <WordMode lines={lines} active={active} colors={colors} position={position} />;
    case "char":      return <CharMode lines={lines} active={active} colors={colors} />;
    case "wave":      return <WaveMode lines={lines} active={active} colors={colors} />;
    case "neon":      return <NeonMode lines={lines} active={active} colors={colors} />;
    case "cinema":    return <CinemaMode lines={lines} active={active} colors={colors} />;
    case "float":     return <FloatMode lines={lines} active={active} colors={colors} />;
    case "fluid":     return <FluidMode lines={lines} active={active} colors={colors} />;
    default:          return <AppleMode lines={lines} active={active} colors={colors} />;
  }
}

// ─── Apple Style (iOS-inspired) ───────────────────────────────────────────────
function AppleMode({ lines, active, colors }: { lines: LyricsLine[]; active: number; colors: any }) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: Math.max(0, active - 2), animated: true, viewOffset: 60 });
  }, [active]);

  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, i) => String(i)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: SH * 0.3 }}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item, index }) => {
        const isActive = index === active;
        const isPast = index < active;
        return (
          <View style={styles.appleLine}>
            <Text
              style={[
                styles.appleText,
                {
                  color: isActive ? colors.accent : isPast ? colors.mutedForeground + "80" : colors.foreground + "50",
                  fontSize: isActive ? 28 : 22,
                  fontWeight: isActive ? "800" : "600",
                  transform: [{ scale: isActive ? 1 : 0.92 }],
                  lineHeight: isActive ? 40 : 32,
                },
              ]}
            >
              {item.text}
            </Text>
          </View>
        );
      }}
    />
  );
}

// ─── Karaoke (word fill) ──────────────────────────────────────────────────────
function KaraokeMode({ lines, active, colors, position }: { lines: LyricsLine[]; active: number; colors: any; position: number }) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: Math.max(0, active - 2), animated: true, viewOffset: 60 });
  }, [active]);

  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, i) => String(i)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: SH * 0.3 }}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item, index }) => {
        const isActive = index === active;
        const isPast = index < active;
        const nextTime = lines[index + 1]?.time ?? item.time + 4;
        const elapsed = position - item.time;
        const total = nextTime - item.time;
        const prog = isActive ? Math.min(1, elapsed / total) : isPast ? 1 : 0;
        return (
          <View style={styles.karaokeLine}>
            <View style={{ position: "relative" }}>
              <Text style={[styles.karaokeBase, { color: colors.foreground + "30", fontSize: isActive ? 24 : 18 }]}>
                {item.text}
              </Text>
              <View style={[styles.karaokeFill, { width: `${prog * 100}%` }]} pointerEvents="none">
                <Text style={[styles.karaokeBase, { color: colors.accent, fontSize: isActive ? 24 : 18 }]}>
                  {item.text}
                </Text>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

// ─── Word by Word ─────────────────────────────────────────────────────────────
function WordMode({ lines, active, colors, position }: { lines: LyricsLine[]; active: number; colors: any; position: number }) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: Math.max(0, active - 2), animated: true, viewOffset: 60 });
  }, [active]);

  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, i) => String(i)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: SH * 0.3 }}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item, index }) => {
        const isActive = index === active;
        const isPast = index < active;
        const nextTime = lines[index + 1]?.time ?? item.time + 4;
        const elapsed = position - item.time;
        const total = Math.max(1, nextTime - item.time);
        const words = item.text.split(" ");
        const activeWord = isActive ? Math.floor((elapsed / total) * words.length) : isPast ? words.length : -1;
        return (
          <View style={styles.wordLine}>
            <Text style={{ flexWrap: "wrap", flexDirection: "row" }}>
              {words.map((w: string, wi: number) => (
                <Text
                  key={wi}
                  style={{
                    fontSize: isActive ? 22 : 16,
                    fontWeight: "700",
                    color: wi < activeWord ? colors.accent : wi === activeWord && isActive ? colors.accent : colors.foreground + (isPast ? "40" : "20"),
                    marginRight: 5,
                  }}
                >
                  {w}{" "}
                </Text>
              ))}
            </Text>
          </View>
        );
      }}
    />
  );
}

// ─── Char by Char ─────────────────────────────────────────────────────────────
function CharMode({ lines, active, colors }: { lines: LyricsLine[]; active: number; colors: any }) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: Math.max(0, active - 2), animated: true, viewOffset: 60 });
  }, [active]);

  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, i) => String(i)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: SH * 0.3 }}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item, index }) => {
        const isActive = index === active;
        const isPast = index < active;
        return (
          <View style={styles.charLine}>
            <Text style={{ fontSize: isActive ? 22 : 16 }}>
              {item.text.split("").map((ch: string, ci: number) => (
                <Text
                  key={ci}
                  style={{
                    color: isActive ? colors.accent : isPast ? colors.foreground + "40" : colors.foreground + "20",
                    fontWeight: "700",
                  }}
                >
                  {ch}
                </Text>
              ))}
            </Text>
          </View>
        );
      }}
    />
  );
}

// ─── Wave Mode ────────────────────────────────────────────────────────────────
function WaveLine({ text, isActive, isPast, index, colors }: { text: string; isActive: boolean; isPast: boolean; index: number; colors: any }) {
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave, { toValue: -6, duration: 500 + index * 50, useNativeDriver: true }),
          Animated.timing(wave, { toValue: 6, duration: 500 + index * 50, useNativeDriver: true }),
          Animated.timing(wave, { toValue: 0, duration: 500 + index * 50, useNativeDriver: true }),
        ])
      ).start();
    } else {
      wave.stopAnimation();
      Animated.timing(wave, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [isActive]);

  return (
    <Animated.View style={[styles.waveLine, { transform: [{ translateY: wave }] }]}>
      <Text
        style={{
          color: isActive ? colors.accent : isPast ? colors.foreground + "40" : colors.foreground + "20",
          fontSize: isActive ? 24 : 17,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

function WaveMode({ lines, active, colors }: { lines: LyricsLine[]; active: number; colors: any }) {
  const listRef = useRef<FlatList>(null);
  useEffect(() => {
    listRef.current?.scrollToIndex({ index: Math.max(0, active - 2), animated: true, viewOffset: 60 });
  }, [active]);
  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, i) => String(i)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: SH * 0.3 }}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item, index }) => (
        <WaveLine
          text={item.text}
          isActive={index === active}
          isPast={index < active}
          index={index}
          colors={colors}
        />
      )}
    />
  );
}

// ─── Neon Mode ────────────────────────────────────────────────────────────────
function NeonLine({ text, isActive, isPast, colors }: { text: string; isActive: boolean; isPast: boolean; colors: any }) {
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glow.stopAnimation();
      Animated.timing(glow, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [isActive]);

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.neonLine}>
      {isActive && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity, alignItems: "center" }]}
        >
          <Text
            style={{
              color: colors.accent,
              fontSize: 24,
              fontWeight: "800",
              textShadowColor: colors.accent,
              textShadowRadius: 20,
              textShadowOffset: { width: 0, height: 0 },
              opacity: 0.5,
            }}
          >
            {text}
          </Text>
        </Animated.View>
      )}
      <Text
        style={{
          color: isActive ? colors.accent : isPast ? colors.foreground + "30" : colors.foreground + "15",
          fontSize: isActive ? 24 : 17,
          fontWeight: "800",
          textAlign: "center",
          textShadowColor: isActive ? colors.accent : "transparent",
          textShadowRadius: isActive ? 12 : 0,
          textShadowOffset: { width: 0, height: 0 },
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function NeonMode({ lines, active, colors }: { lines: LyricsLine[]; active: number; colors: any }) {
  const listRef = useRef<FlatList>(null);
  useEffect(() => {
    listRef.current?.scrollToIndex({ index: Math.max(0, active - 2), animated: true, viewOffset: 60 });
  }, [active]);
  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, i) => String(i)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: SH * 0.3, backgroundColor: "#000" }}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item, index }) => (
        <NeonLine text={item.text} isActive={index === active} isPast={index < active} colors={colors} />
      )}
    />
  );
}

// ─── Cinema Mode ──────────────────────────────────────────────────────────────
function CinemaMode({ lines, active, colors }: { lines: LyricsLine[]; active: number; colors: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const prevActive = useRef(active);

  useEffect(() => {
    if (prevActive.current !== active) {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      prevActive.current = active;
    }
  }, [active]);

  const line = lines[active];
  const prevLine = active > 0 ? lines[active - 1] : null;
  const nextLine = active < lines.length - 1 ? lines[active + 1] : null;

  return (
    <View style={styles.cinemaContainer}>
      {prevLine && (
        <Text style={[styles.cineSecondary, { color: colors.foreground + "30" }]} numberOfLines={2}>
          {prevLine.text}
        </Text>
      )}
      <Animated.Text
        style={[styles.cinemaMain, { color: colors.accent, opacity }]}
        numberOfLines={3}
      >
        {line?.text ?? ""}
      </Animated.Text>
      {nextLine && (
        <Text style={[styles.cineSecondary, { color: colors.foreground + "25" }]} numberOfLines={2}>
          {nextLine.text}
        </Text>
      )}
    </View>
  );
}

// ─── Float Mode ───────────────────────────────────────────────────────────────
function FloatLine({ text, isActive, isPast, colors }: { text: string; isActive: boolean; isPast: boolean; colors: any }) {
  const anim = useRef(new Animated.Value(isPast ? 0 : isActive ? 0 : 30)).current;
  const opacAnim = useRef(new Animated.Value(isPast ? 0.3 : isActive ? 1 : 0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.spring(anim, { toValue: 0, useNativeDriver: true }),
        Animated.timing(opacAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    } else if (isPast) {
      Animated.parallel([
        Animated.timing(anim, { toValue: -10, duration: 300, useNativeDriver: true }),
        Animated.timing(opacAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isActive, isPast]);

  return (
    <Animated.View style={[styles.floatLine, { transform: [{ translateY: anim }], opacity: opacAnim }]}>
      <Text style={{ color: isActive ? colors.accent : colors.foreground, fontSize: isActive ? 24 : 17, fontWeight: "700", textAlign: "center" }}>
        {text}
      </Text>
    </Animated.View>
  );
}

function FloatMode({ lines, active, colors }: { lines: LyricsLine[]; active: number; colors: any }) {
  const listRef = useRef<FlatList>(null);
  useEffect(() => {
    listRef.current?.scrollToIndex({ index: Math.max(0, active - 2), animated: true, viewOffset: 60 });
  }, [active]);
  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, i) => String(i)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: SH * 0.3 }}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item, index }) => (
        <FloatLine text={item.text} isActive={index === active} isPast={index < active} colors={colors} />
      )}
    />
  );
}

// ─── Fluid Mode ───────────────────────────────────────────────────────────────
function FluidMode({ lines, active, colors }: { lines: LyricsLine[]; active: number; colors: any }) {
  const listRef = useRef<FlatList>(null);
  useEffect(() => {
    listRef.current?.scrollToIndex({ index: Math.max(0, active - 2), animated: true, viewOffset: 80 });
  }, [active]);
  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, i) => String(i)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: SH * 0.35, paddingHorizontal: 20 }}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item, index }) => {
        const isActive = index === active;
        const dist = Math.abs(index - active);
        return (
          <Text
            style={{
              fontSize: isActive ? 26 : Math.max(14, 20 - dist * 2),
              fontWeight: isActive ? "800" : "500",
              color: isActive
                ? colors.accent
                : `rgba(255,255,255,${Math.max(0.1, 0.6 - dist * 0.12)})`,
              textAlign: "center",
              paddingVertical: 6,
              lineHeight: isActive ? 38 : 28,
            }}
          >
            {item.text}
          </Text>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16 },
  scroll: { flex: 1 },
  plainContent: { padding: 24 },
  plainText: { fontSize: 16, lineHeight: 28 },
  appleLine: { paddingHorizontal: 24, paddingVertical: 10 },
  appleText: { fontWeight: "600" },
  karaokeLine: { paddingHorizontal: 24, paddingVertical: 10, overflow: "hidden" },
  karaokeBase: { fontWeight: "700" },
  karaokeFill: { position: "absolute", top: 0, bottom: 0, overflow: "hidden" },
  wordLine: { paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", flexWrap: "wrap" },
  charLine: { paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", flexWrap: "wrap" },
  waveLine: { paddingHorizontal: 24, paddingVertical: 10, alignItems: "center" },
  neonLine: { paddingHorizontal: 24, paddingVertical: 10, alignItems: "center", position: "relative" },
  cinemaContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  cinemaMain: { fontSize: 32, fontWeight: "800", textAlign: "center", lineHeight: 46, marginVertical: 16 },
  cineSecondary: { fontSize: 18, fontWeight: "600", textAlign: "center", lineHeight: 28 },
  floatLine: { paddingHorizontal: 24, paddingVertical: 10, alignItems: "center" },
});
