Assets for the overlay UI

Place the following files in this folder to enable audio and animations used by `overlay.html`:

- `battle-loop.mp3` — background battle music (loops while overlay active)
- `pokemon-mewtwo.gif` — intro lockdown animation (optional)
- `background-pixel-forest.png` — pixel-art battle background (optional)
- `ryu3.gif` — AI idle animation / icon (optional)
- `agcnla7ehef41.gif` — AI response animation (optional)

If `battle-loop.mp3` is present at `extension/assets/battle-loop.mp3`, the overlay will attempt to play it when the lockdown starts. Modern browsers may block autoplay; in that case the music will start on the first user interaction.
