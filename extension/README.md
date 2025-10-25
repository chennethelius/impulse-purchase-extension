# Impulse Blocker — Extension README

This folder contains the Chrome extension that helps slow down impulse purchases by locking the browser and initiating a debate-style chatbot 'battle' before allowing substantial purchases.

Quick facts
- Manifest: `manifest.json` (Manifest V3)
- Background: `background.js` (service worker)
- Content script: `content.js` (injected into matching hosts)
- Overlay UI: `overlay.html`, `overlay.js`, `styles.css`

Load the extension (unpacked)

1. Open Chrome and go to chrome://extensions
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked" and select this repository's `extension/` folder.

If you're working from the devcontainer and want to move files to your host machine first, download the `extension/` folder or the generated `impulse-purchase-extension.zip` from the repo root, unzip it locally, then use "Load unpacked" with the unzipped `extension/` directory.

Testing notes
- Host matches are currently set for Amazon, eBay and Etsy (see `manifest.json` -> `host_permissions`).
- To test, open a product/buy page on one of the matching sites and perform the normal steps that would trigger the extension's detector.
- The overlay UI uses `overlay.html` and is exposed via `web_accessible_resources` so the content script can inject it.

Developer notes
- Branch: this README was added on branch `Jonny-edits`.
- To commit changes locally and push on this branch:

```bash
cd /path/to/impulse-purchase-extension
git checkout Jonny-edits
git add extension/README.md
git commit -m "Add extension README with load and test instructions"
git push
```

Troubleshooting
- If Chrome refuses to load the extension because of MV3 features, make sure you're using a recent Chrome/Chromium release.
- If the overlay does not appear, open DevTools on the page and check the Console for errors from `content.js` or `overlay.js`.

Future ideas
- Add an Options page to set the price threshold, enable/disable sites, and customize sound/animations.
- Add automated tests for the buy-page detector in `content.js`.

License
- See project root `LICENSE`.

Enjoy — open an Amazon product page and try the extension to see the 'battle' overlay in action.
