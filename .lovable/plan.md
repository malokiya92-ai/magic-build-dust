# Make SP·09 look like a premium studio tool

Right now the screen reads flat: lots of empty dark space, thin outlined boxes that all look the same, and panels that stay blank until audio is playing. The plan below keeps every feature and control exactly as it is, and only changes how it looks and feels.

## What changes

1. **Panels get real depth**
   Softly lit panel surfaces with a subtle top highlight, deeper shadow, and thin glowing edge instead of the current flat outlines. Section titles get a small colored accent mark so the eye can find them quickly.

2. **No more empty boxes**
   The spectrum, comparison and waveform areas show a calm idle state when nothing is playing: a faint grid, a resting line, and a short hint ("Load a file or enable the mic"). The graphs also get gradient fills and a soft glow so they look alive when audio runs.

3. **Header becomes a proper instrument face**
   Bigger wordmark with a thin gradient underline, a compact status cluster (source, sample rate, live indicator) and a clearly styled DRY/WET switch with an on-state glow.

4. **Band strip redesign**
   Each band becomes a taller, richer channel strip: colored top cap, larger frequency readout, tinted track that matches the band color, gain value shown in a small chip, and a hover lift. The five strips fill the width evenly instead of floating small.

5. **Left rail polish**
   Presets become a tidy two-column grid with a clearly marked active state and glow. Sliders get thicker tinted tracks with value chips. Panels in the rail get consistent headers and spacing.

6. **Page balance**
   The huge empty area under the content is removed by letting the main column fill the viewport height, so the layout looks intentional at any window size.

7. **Motion and detail**
   Gentle fade/rise on load, smooth hover transitions, a slow pulsing live dot, and a subtle animated glow behind the header. Nothing distracting.

## Technical notes

- New/adjusted tokens in `src/index.css`: elevated panel gradient, inner-highlight and outer shadow variables, glow rings, band-tinted track colors, idle-grid color. All values as HSL tokens; no hard-coded colors in components.
- `tailwind.config.ts`: add the new shadow/gradient/animation utilities (fade-up, slow pulse, glow).
- Reworked presentation only in: `Index.tsx` (shell, header, spacing, min-height), `BandControl.tsx`, `PresetSelector.tsx`, `NoiseReductionPanel.tsx`, `MasterOutputPanel.tsx`, `TransportBar.tsx`, `LevelMeters.tsx`.
- Canvas components (`SpectrumAnalyzer`, `EQCurveDisplay`, `ComparisonView`): add idle-state rendering, gradient fills, glow strokes, and rounded caps. Audio engine and all signal logic stay untouched.
