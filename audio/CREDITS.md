# Voxel Garden — ASMR soundscapes

The five finished backgrounds (clear.ogg, cloudy.ogg, rain.ogg, fog.ogg, snow.ogg) blend and process the following recordings into diffuse soundscapes. All source recordings are offered under CC0 1.0 by their authors:
https://creativecommons.org/publicdomain/zero/1.0/

## Forest and wind

- Author: Thimras
- Work: Park ambiences (2022-07-25)
- Source and license declaration: https://opengameart.org/content/park-ambiences
- Original forest recording: https://opengameart.org/sites/default/files/park_ambience_birds.wav
- Original wind recording: https://opengameart.org/sites/default/files/park_ambience_wind.wav
- Intermediate edits: forest excerpt 20–65 seconds; wind excerpt 35–80 seconds. High/low-pass filtering, loudness normalization (forest -23 LUFS; wind -25 LUFS), three-second tail/head crossfade for 42-second source loops.

## Rain

- Author: Ylmir
- Work: Rain (loopable) (2016-03-28)
- Source and license declaration: https://opengameart.org/content/rain-loopable
- Original archive: https://opengameart.org/sites/default/files/Rain%20OGG.zip
- Original file: 3.ogg
- Intermediate edit: first 35 seconds, high/low-pass filtering, -23 LUFS normalization, three-second tail/head crossfade for a 32-second source loop.

## Final soundscape processing

Forest / wind / rain source gain weights: clear = 0.12 / 0.75 / 0.08; cloudy = 0.025 / 0.8 / 0.22; rain = 0.01 / 0.35 / 0.7. These are background textures, rather than separately triggered foreground effects.

The mixes are band-limited to 140–3600 Hz, compressed (threshold 0.025, ratio 4, attack 200 ms, release 1000 ms), gently diffused with quiet delayed taps (127/293/419 ms at 0.10/0.08/0.06), and normalized to -25 LUFS / -8 dBTP / LRA 4. A three-second tail/head crossfade makes each 29-second loop. Final format: stereo Vorbis quality 3, 44.1 kHz. Runtime volume defaults to 45% with gradual weather crossfades and softer night/indoor levels.

Fog re-mixes cloudy/clear at 0.75/0.25, band-limits to 160–1900 Hz, and normalizes to -27 LUFS / -9 dBTP / LRA 3. Snow re-mixes clear/cloudy at 0.65/0.35, band-limits to 260–4200 Hz, and normalizes to -26 LUFS / -9 dBTP / LRA 3. Both use a two-second tail/head crossfade for 27-second loops, in the same stereo Vorbis format. No new third-party sources are used.

The documentation preview mixes excerpts of all five final backgrounds, with two-second crossfades.

Downloaded 2026-11-14. The application serves these files locally; no external audio service is required during play. Attribution is retained as provenance even though CC0 does not require it.
