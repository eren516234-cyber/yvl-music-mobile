import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoredTrack = {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  duration?: number;
  albumId?: string;
  albumName?: string;
};

export type Playlist = {
  id: string;
  name: string;
  createdAt: number;
  tracks: StoredTrack[];
  isDownloads?: boolean;
  isLiked?: boolean;
};

export const DOWNLOADS_ID = "yvl_downloads";
export const LIKED_ID = "yvl_liked";

// ─── Keys ─────────────────────────────────────────────────────────────────────

const PLAYLISTS_KEY = "@yvl/playlists_v1";
const HISTORY_KEY = "@yvl/history_v1";
const SETTINGS_KEY = "@yvl/settings_v1";
const DOWNLOADS_KEY = "@yvl/downloads_v1";

// ─── Playlists ────────────────────────────────────────────────────────────────

export async function getPlaylists(): Promise<Playlist[]> {
  try {
    const raw = await AsyncStorage.getItem(PLAYLISTS_KEY);
    return raw ? (JSON.parse(raw) as Playlist[]) : [];
  } catch { return []; }
}

async function savePlaylists(pls: Playlist[]): Promise<void> {
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(pls));
}

export async function getOrCreateDownloads(): Promise<Playlist> {
  const pls = await getPlaylists();
  const existing = pls.find((p) => p.id === DOWNLOADS_ID);
  if (existing) return existing;
  const dl: Playlist = { id: DOWNLOADS_ID, name: "Downloads", createdAt: Date.now(), tracks: [], isDownloads: true };
  await savePlaylists([dl, ...pls]);
  return dl;
}

export async function getOrCreateLiked(): Promise<Playlist> {
  const pls = await getPlaylists();
  const existing = pls.find((p) => p.id === LIKED_ID);
  if (existing) return existing;
  const liked: Playlist = { id: LIKED_ID, name: "Liked Songs", createdAt: Date.now(), tracks: [], isLiked: true };
  await savePlaylists([...pls, liked]);
  return liked;
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const pls = await getPlaylists();
  const pl: Playlist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || "Untitled playlist",
    createdAt: Date.now(),
    tracks: [],
  };
  await savePlaylists([pl, ...pls]);
  return pl;
}

export async function deletePlaylist(id: string): Promise<void> {
  if (id === DOWNLOADS_ID || id === LIKED_ID) return;
  const pls = await getPlaylists();
  await savePlaylists(pls.filter((p) => p.id !== id));
}

export async function addToPlaylist(playlistId: string, track: StoredTrack): Promise<void> {
  const pls = await getPlaylists();
  const p = pls.find((p) => p.id === playlistId);
  if (!p) return;
  if (p.tracks.some((t) => t.id === track.id)) return;
  p.tracks.push(track);
  await savePlaylists(pls);
}

export async function removeFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const pls = await getPlaylists();
  const p = pls.find((p) => p.id === playlistId);
  if (!p) return;
  p.tracks = p.tracks.filter((t) => t.id !== trackId);
  await savePlaylists(pls);
}

export async function addToDownloads(track: StoredTrack): Promise<void> {
  await getOrCreateDownloads();
  const pls = await getPlaylists();
  const dl = pls.find((p) => p.id === DOWNLOADS_ID);
  if (!dl) return;
  if (dl.tracks.some((t) => t.id === track.id)) return;
  dl.tracks.push(track);
  await savePlaylists(pls);
}

export async function isDownloaded(trackId: string): Promise<boolean> {
  const pls = await getPlaylists();
  const dl = pls.find((p) => p.id === DOWNLOADS_ID);
  return !!dl?.tracks.some((t) => t.id === trackId);
}

export async function toggleLike(track: StoredTrack): Promise<boolean> {
  await getOrCreateLiked();
  const pls = await getPlaylists();
  const liked = pls.find((p) => p.id === LIKED_ID);
  if (!liked) return false;
  const exists = liked.tracks.some((t) => t.id === track.id);
  if (exists) {
    liked.tracks = liked.tracks.filter((t) => t.id !== track.id);
    await savePlaylists(pls);
    return false;
  } else {
    liked.tracks.unshift(track);
    await savePlaylists(pls);
    return true;
  }
}

export async function isLiked(trackId: string): Promise<boolean> {
  const pls = await getPlaylists();
  const liked = pls.find((p) => p.id === LIKED_ID);
  return !!liked?.tracks.some((t) => t.id === trackId);
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function addToHistory(track: StoredTrack): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const hist: StoredTrack[] = raw ? JSON.parse(raw) : [];
    const filtered = hist.filter((t) => t.id !== track.id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([track, ...filtered].slice(0, 50)));
  } catch {}
}

export async function getHistory(): Promise<StoredTrack[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ─── Downloads (local URI map) ────────────────────────────────────────────────

export async function getDownloadUri(trackId: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    return map[trackId] ?? null;
  } catch { return null; }
}

export async function saveDownloadUri(trackId: string, uri: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[trackId] = uri;
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(map));
  } catch {}
}

// ─── Recent Searches ──────────────────────────────────────────────────────────

const RECENT_SEARCHES_KEY = "@yvl/recent_searches_v1";

export async function saveRecentSearch(query: string): Promise<void> {
  try {
    const searches = await getRecentSearches();
    const updated = [query, ...searches.filter((s) => s !== query)].slice(0, 10);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
}

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

export async function removeRecentSearch(query: string): Promise<void> {
  try {
    const searches = await getRecentSearches();
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.filter((s) => s !== query)));
  } catch {}
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export type Settings = {
  quality: "96kbps" | "160kbps" | "320kbps";
  lyricsMode: string;
  accentHex: string;
  rainbow: boolean;
  perScreenColour: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  quality: "320kbps",
  lyricsMode: "ios",
  accentHex: "#ffffff",
  rainbow: false,
  perScreenColour: false,
};

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  try {
    const current = await getSettings();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  } catch {}
}
