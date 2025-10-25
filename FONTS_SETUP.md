# Font Setup Instructions

## PKMN RBYGSC Font

To use the authentic Pokemon Gen 1-3 font (PKMN RBYGSC) in the extension:

### Setup Steps:

1. **Download the font** from [dafont.com/pkmn-rbygsc.font](https://www.dafont.com/pkmn-rbygsc.font)

2. **Create fonts directory** (if it doesn't exist):
   ```bash
   mkdir -p extension/fonts
   ```

3. **Extract and place the font file**:
   - Extract the downloaded ZIP file
   - Copy `PKMN-RBYGSC.ttf` to `extension/fonts/` folder
   - Your structure should look like:
     ```
     extension/
     ├── fonts/
     │   └── PKMN-RBYGSC.ttf
     ├── styles.css
     ├── fonts.css
     └── ...
     ```

4. **Add to manifest.json** (already included):
   - The `fonts/PKMN-RBYGSC.ttf` file is listed in `web_accessible_resources`

5. **Reload the extension**:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the Impulse Blocker extension

## Font Fallback

If the PKMN RBYGSC font file is missing, the extension will automatically fall back to **Press Start 2P** from Google Fonts, which maintains the retro Pokemon aesthetic.

## Current Font Stack

```css
--font-primary: 'PKMN RBYGSC', 'Press Start 2P', monospace;
```

- **Primary**: PKMN RBYGSC (local file)
- **Fallback 1**: Press Start 2P (Google Fonts - always available)
- **Fallback 2**: System monospace font
