# Tower Defense Game Audio

This directory contains runtime-served audio files used in the Tower Defense game.

The editable source-of-truth audio library now lives in the sibling `CodeGrind_Assets/Sound_Assets/` tree. Keep long-term source files there, and treat this folder as the runtime delivery surface that must continue matching the `/audio/...` paths referenced in the frontend.

## Directory Structure

- `/audio/wave-start.mp3` - Legacy wave start cue
- `/audio/generated_sound_effects/event_sound_effects/*.wav` - Generated UI/gameplay SFX
- `/audio/generated_sound_effects/deployable_sfx/*.wav` - Generated deployable SFX
- `/audio/generated_sound_effects/tower_projectile_sounds/*.wav` - Generated tower projectile SFX
- `/audio/karl-casey/*.mp3` - Background music tracks by Karl Casey @ White Bat Audio

## Adding New Generated Sound Effects

1. **Generate the SFX** as WAV files.
2. **Keep the editable source file** under `CodeGrind_Assets/Sound_Assets/`.
3. **Ensure a runtime-served copy exists** at the matching `/audio/generated_sound_effects/...` path.
4. **Update soundEffects.js** to reference the new files:
  - Add to `SOUND_EFFECTS` for volume tuning and naming.
  - Add to the `soundEffects` map for playback IDs.
5. **Update AUDIO_ATTRIBUTION.md** if the asset is not fully in-house generated.

## Adding New Music Tracks

To add new music tracks to the game:

1. **Download the tracks** - Download the audio files you want to use
2. **Store the editable source files** under `CodeGrind_Assets/Sound_Assets/`.
3. **Publish or copy the runtime-served files** so the existing `/audio/...` path still resolves:
  - For Karl Casey music: `/audio/karl-casey/`
  - For other artists: consider creating a matching subdirectory
4. **Update AUDIO_ATTRIBUTION.md** - Add proper attribution for the tracks
5. **Update soundEffects.js** - Add the tracks to the BACKGROUND_MUSIC array:

```javascript
// Example of adding a new track
{ 
  id: 'track-name', 
  path: '/audio/artist-name/track-name.mp3', 
  title: 'Track Title',
  artist: 'Artist Name',
  attribution: 'Attribution text'
}
```

## File Naming Convention

Use kebab-case (lowercase with hyphens) for sound IDs and prefer consistent naming for file paths:
- `cyberpunk_buttonclick.wav`
- `deployable_triggered.wav`
- `dragged-across-concrete.mp3`

## Audio Formats

- Generated sound effects are stored as WAV files
- Background music is stored as MP3 for best browser compatibility
- For sound effects, use short audio clips (< 2 seconds) with small file sizes
- For background music, optimize for quality vs. file size (128-192kbps)

## Attribution Requirements

Always provide proper attribution for the audio files you use:

- Include the author's name
- Include the source URL
- Include the license type
- Add to the AUDIO_ATTRIBUTION.md file

For Karl Casey's music, attribute as "Music by Karl Casey @ White Bat Audio" in your game. 