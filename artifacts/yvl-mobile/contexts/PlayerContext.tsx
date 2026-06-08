import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Audio } from "expo-av";
import { Saavn, toTrack, type Track } from "@/lib/saavn";
import { addToHistory } from "@/lib/storage";
import { useTheme } from "./ThemeContext";

type PlayerCtxType = {
  queue: Track[];
  index: number;
  current?: Track;
  isPlaying: boolean;
  position: number;
  duration: number;
  play: (tracks: Track[], startIndex?: number) => Promise<void>;
  toggle: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (t: number) => Promise<void>;
  addToQueue: (track: Track) => void;
  clearQueue: () => void;
};

const PlayerCtx = createContext<PlayerCtxType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { quality } = useTheme();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (typeof Audio?.setAudioModeAsync === "function") {
      void Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
    }
  }, []);

  const unloadCurrent = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  }, []);

  const loadAndPlay = useCallback(async (track: Track, q: Track[], idx: number) => {
    await unloadCurrent();
    setPosition(0);
    setDuration(0);

    let stream = track.stream;
    if (!stream) {
      try {
        const full = await Saavn.song(track.id);
        const resolved = toTrack(full, quality);
        stream = resolved.stream;
        if (stream) {
          track.stream = stream;
          track.duration = track.duration || resolved.duration;
          track.cover = track.cover || resolved.cover;
          setQueue((prev) => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], stream, cover: track.cover, duration: track.duration };
            return copy;
          });
        }
      } catch (e) {
        console.error("Stream resolve failed", e);
        return;
      }
    }
    if (!stream) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: stream },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        (status) => {
          if (!status.isLoaded) return;
          setPosition((status.positionMillis ?? 0) / 1000);
          setDuration((status.durationMillis ?? 0) / 1000);
          setIsPlaying(status.isPlaying ?? false);
          if (status.didJustFinish) {
            const nextIdx = idx + 1;
            if (nextIdx < q.length) {
              void loadAndPlay(q[nextIdx], q, nextIdx);
              setIndex(nextIdx);
            }
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
      void addToHistory({
        id: track.id,
        title: track.title,
        artist: track.artist,
        cover: track.cover,
        duration: track.duration,
        albumId: track.albumId,
        albumName: track.albumName,
      });
    } catch (e) {
      console.error("Sound load failed", e);
    }
  }, [unloadCurrent, quality]);

  const play = useCallback(async (tracks: Track[], startIndex = 0) => {
    setQueue(tracks);
    setIndex(startIndex);
    await loadAndPlay(tracks[startIndex], tracks, startIndex);
  }, [loadAndPlay]);

  const toggle = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {}
  }, []);

  const next = useCallback(async () => {
    setIndex((prev) => {
      const nextIdx = prev + 1;
      if (nextIdx < queue.length) {
        void loadAndPlay(queue[nextIdx], queue, nextIdx);
        return nextIdx;
      }
      return prev;
    });
  }, [queue, loadAndPlay]);

  const prev = useCallback(async () => {
    if (position > 3) {
      await soundRef.current?.setPositionAsync(0);
      return;
    }
    setIndex((prev) => {
      const prevIdx = prev - 1;
      if (prevIdx >= 0) {
        void loadAndPlay(queue[prevIdx], queue, prevIdx);
        return prevIdx;
      }
      return prev;
    });
  }, [position, queue, loadAndPlay]);

  const seek = useCallback(async (t: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(t * 1000);
      setPosition(t);
    } catch {}
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const clearQueue = useCallback(() => {
    void unloadCurrent();
    setQueue([]);
    setIndex(0);
    setIsPlaying(false);
  }, [unloadCurrent]);

  return (
    <PlayerCtx.Provider value={{
      queue, index, current: queue[index],
      isPlaying, position, duration,
      play, toggle, next, prev, seek,
      addToQueue, clearQueue,
    }}>
      {children}
    </PlayerCtx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer outside PlayerProvider");
  return ctx;
}
