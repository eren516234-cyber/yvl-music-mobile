# YVL Music

A full-featured music streaming mobile app (Expo/React Native) that streams from JioSaavn, downloads tracks, shows 9 lyrics modes, and features a rainbow-fade colour theme system.

## Run & Operate

- `pnpm --filter @workspace/yvl-mobile run dev` — run the Expo app (Metro)
- `pnpm --filter @workspace/yvl-mobile run typecheck` — typecheck mobile
- Scan the QR code in the Expo workflow logs with **Expo Go** to preview on device

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, React Native, Expo Router (tabs + modals)
- Audio: expo-av
- Storage: @react-native-async-storage/async-storage
- API: JioSaavn (via melo.harekrishnasagar.com proxy)
- Lyrics: lrclib.net API
- Build: EAS Build → APK (GitHub Actions CI via `eas.json`)

## Where things live

- `artifacts/yvl-mobile/` — entire mobile app
- `artifacts/yvl-mobile/app/(tabs)/` — 4 tab screens: index, search, library, settings
- `artifacts/yvl-mobile/app/player.tsx` — full-screen player modal
- `artifacts/yvl-mobile/components/FullPlayer.tsx` — vinyl-disc player UI
- `artifacts/yvl-mobile/components/MiniPlayer.tsx` — floating mini-player bar
- `artifacts/yvl-mobile/components/LyricsView.tsx` — 9 lyrics display modes
- `artifacts/yvl-mobile/contexts/ThemeContext.tsx` — accent colour + rainbow + perScreenColour
- `artifacts/yvl-mobile/contexts/PlayerContext.tsx` — playback state (expo-av)
- `artifacts/yvl-mobile/lib/saavn.ts` — JioSaavn API client
- `artifacts/yvl-mobile/lib/lrclib.ts` — lyrics fetcher
- `artifacts/yvl-mobile/lib/storage.ts` — playlists, liked, history, recent searches

## Architecture decisions

- Pure black (#000) background everywhere; Settings screen uniquely uses the accent colour as its background with luminance-based text.
- `FullPlayer` is a self-contained component that owns its own header (down chevron + NOW PLAYING / YVL), passed an `onClose` callback from `app/player.tsx`.
- `SongRow` shows a circular-outline play button and animated equaliser bars when active.
- Rainbow mode runs a 14 s hue cycle at 33 ms intervals (≈30 fps) inside ThemeContext.
- EAS Build config in `eas.json` with `android.buildType: "apk"` for sideloadable APK output.

## Product

Stream any song from JioSaavn, auto-download for offline play, view animated lyrics in 9 modes (Apple-style, Karaoke, Word, Char, Fluid, Wave, Neon, Cinema, Float), manage playlists and liked songs, and personalise with a live rainbow colour theme.

## User preferences

- Pure black UI (#000000), no grays — matches screenshots provided by user.
- "YVL" brand in very bold/heavy weight (fontWeight 900) as the home screen logo.
- Settings screen background = current accent colour (dynamic).
- Song rows use a circle-outline play button (not filled), white border.

## Gotchas

- Never use `router = "expo-domain"` in artifact.toml — causes >180s health check timeout. Use `ensurePreviewReachable = "/status"` instead.
- Do NOT run `pnpm dev` at workspace root. Use `restart_workflow` to manage the Expo process.
- React Compiler (`reactCompiler: true`) must stay disabled in app.json — caused Metro crashes.
- EAS Build requires `EXPO_TOKEN` in GitHub repo secrets to work in CI.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
