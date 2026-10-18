# Integration guide (beginner-friendly)

## Important
This package does **not** replace your `index.html` or Cloudflare Worker. Your live app has a private IIFE and its renderer section is currently a placeholder. Integrate the bridge and modules below as a small, reversible change. Commit first so you can roll back.

## 1. Download and extract
Download `ai-science-cartoon-studio-video-renderer.zip` and extract it. Copy `video-renderer.js`, `narration.js`, `subtitles.js`, and `animation.js` into the **root** of your GitHub repository, next to `index.html`. Keep `integration/renderer-section.html` and the docs for reference.

## 2. Add the safe project bridge inside the existing IIFE
Find the main application script in `index.html`. It begins approximately with:
```js
<script>(()=>{'use strict';
```
Within that same IIFE, the app defines `projects`, `currentId`, and the `cur()` function. Near the **end of that IIFE**, after `cur()` exists and before the closing `})();`, add this bridge:

```js
// Public, read-only bridge used by the optional video-renderer modules.
window.ScienceStudio = window.ScienceStudio || {};
window.ScienceStudio.getCurrentProject = function () {
  const project = cur();
  if (!project) return null;
  // Return a snapshot so the renderer cannot mutate the app's live project.
  return JSON.parse(JSON.stringify(project));
};
```

This bridge exposes only the current project snapshot; it does not expose API keys or Worker secrets. Do not paste this at the top-level outside the IIFE, because `cur()` is private to the IIFE. The renderer expects scene fields such as `title`, `duration`, `narration`, `camera`, and one of `imageData`, `imageUrl`, `image`, or `generatedImage`. If your image generator saves a different field, map that field to `imageData` in the returned snapshot (do not alter stored projects). Example inside the return object: `scenes: project.scenes.map(scene => ({...scene, imageData: scene.imageData || scene.yourActualImageField}))`. Replace `yourActualImageField` with the real field name.

## 3. Replace only the renderer section
In `index.html`, locate `<section id="v-renderer" ...>` and its matching `</section>`. Replace **that section only** with the contents of `integration/renderer-section.html`. Do not replace the entire HTML document. Keep the app's existing navigation and `go('renderer')` logic.

## 4. Load scripts in the correct order
The safest option is to add these tags near the bottom of `index.html`, **after the existing app's main inline script has closed** and before `</body>`:

```html
<script src="animation.js"></script>
<script src="subtitles.js"></script>
<script src="narration.js"></script>
<script src="video-renderer.js"></script>
<script>
  (function () {
    const title = document.getElementById("rendererProjectTitle");
    const button = document.getElementById("renderVideoButton");
    const status = document.getElementById("rendererStatus");
    function refreshTitle() {
      const p = window.ScienceStudio && window.ScienceStudio.getCurrentProject();
      if (title) title.textContent = p ? (p.title || p.name || "Untitled project") : "No project selected";
    }
    refreshTitle();
    // Existing app may switch projects after page load. Refresh when opening renderer.
    document.querySelectorAll('[data-view="renderer"], [data-go="renderer"]').forEach(el => {
      el.addEventListener("click", refreshTitle);
    });
    window.ScienceStudioVideoRenderer.connect();
    if (button && !window.ScienceStudio) {
      button.disabled = true;
      if (status) status.textContent = "Project bridge not available. Follow integration-guide.md.";
    }
  })();
</script>
```

Do not include the script tags twice. The bridge must be created by the existing inline app script before these external files execute.

## 5. Commit and publish
In GitHub, open the repository, use **Add file → Upload files**, upload the four JavaScript files and the `integration` folder, and commit to `main`. Edit `index.html` carefully for the two small changes above. GitHub Pages usually updates after a short delay.

## 6. Test the live website
1. Open the live site in a recent desktop Chrome or Edge first.
2. Create/open a project and generate or upload a real image for **every** scene.
3. Check the project title appears in the renderer section.
4. Choose an aspect ratio and press **Render video**.
5. Keep the tab open while progress advances. Do not lock the phone or switch apps during rendering.
6. Play the preview, download the file, then open the downloaded file in a media player. Check its extension and playback.
7. Confirm the status says WebM or MP4 based on the browser's reported MIME type. It must not claim narration audio is embedded.

## 7. Common problems and recovery
- **Project bridge not connected:** the bridge snippet is missing, outside the IIFE, or placed after the scripts. Check spelling of `getCurrentProject`.
- **Missing image:** one or more scenes has no image in a recognized field. Check how the current image generator stores the image. If it stores a URL, it must be reachable by the browser; cross-origin canvas restrictions can prevent capture.
- **Video is empty or recording stops:** try a current desktop Chrome/Edge, fewer scenes, or shorter scene durations. Some browsers block canvas recording or have limited memory.
- **MP4 unavailable:** normal. The renderer chooses a supported MP4 type if exposed; otherwise it uses WebM. Never rename WebM to `.mp4`.
- **No audio in output:** expected. Browser speech synthesis is preview-only; it is not automatically available as a recorded audio track.
- **iPhone/Safari issues:** support varies by iOS version. Test desktop first. If MediaRecorder or canvas capture is unavailable, this module reports an error instead of pretending success.
- **Canvas taint / remote image URL:** images from another origin may require correct CORS response headers. Data URLs created by your app usually work.
- **Need rollback:** use GitHub's file history to restore the previous `index.html`, or revert the integration commit. Do not delete your project or Worker.

## Scope and security
The renderer uses existing images and local browser APIs. It does not call the `/image` endpoint, overwrite your Worker, send project data to a third party, or expose secret keys. Long or high-resolution rendering can exceed mobile memory/time limits. For reliable audio mixing, MP4 output across browsers, long videos, and server-side rendering, plan a separate optional backend (for example, a dedicated FFmpeg worker/service); it is not included or assumed here.
