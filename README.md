# AI Science Cartoon Studio — Video Renderer Module

A plain-JavaScript browser renderer package intended to integrate with the existing GitHub Pages app without replacing `index.html` or changing the Cloudflare Worker.

## Included files
- `video-renderer.js` — loads scene images, renders Canvas frames, records via `MediaRecorder`, reports progress, previews and downloads the result.
- `narration.js` — browser speech-synthesis preview and voice selection API; preview is **not** downloadable audio.
- `subtitles.js` — wraps narration into readable timed subtitle segments and paints them on the canvas.
- `animation.js` — smooth Ken Burns-style zoom/pan movement and reusable drawing helpers.
- `integration/renderer-section.html` — replacement component for the renderer section only.
- `integration-guide.md` — detailed installation, bridge, testing and recovery instructions.

## What the module can do
- Render a scene sequence from the current project's generated images.
- Use scene durations (clamped to 1–60 seconds per scene to prevent accidental runaway renders).
- Produce 16:9 landscape, 9:16 portrait or 1:1 square canvas output.
- Apply gentle still-image zoom/pan, fade transitions, scene titles and timed subtitle text.
- Display progress and actionable errors; provide a preview and download when recording succeeds.
- Prefer a browser-supported MP4 MIME type only when the browser reports support; otherwise use WebM with the correct extension.
- Use existing images; it does not call the image endpoint and does not require a paid rendering API.

## Honest limitations
- **Integration is required.** The current app's project data is private inside an IIFE. Add the small `window.ScienceStudio.getCurrentProject()` bridge and load scripts in the order in `integration-guide.md`.
- The image field must contain a browser-loadable image data URL or URL. If your app uses another property, map it in the bridge snapshot.
- Browser speech synthesis is preview-only. The renderer deliberately does **not** claim that narration audio is embedded, and this package does not record synthesized speech.
- Still images are given camera movement; they are not true 3D animation.
- MP4 recording is browser-dependent. WebM is the normal fallback. MIME support checks do not guarantee every browser/device can successfully record every video.
- Long videos can use substantial RAM and processing time. Mobile browsers may suspend or terminate background work; keep the tab active. Start by testing a short project.
- Remote images may fail due to network, CORS, or canvas-taint restrictions. Prefer the app's generated data URLs when possible.
- This first release does not include audio mixing, server rendering, FFmpeg, cloud job queues, AI generation, or Worker changes.

## Quick test
1. Integrate using `integration-guide.md`.
2. Open a project with a generated image in each scene.
3. Choose 16:9, 9:16 or 1:1 and render.
4. Watch progress reach 100%, play the preview and download the file.
5. Confirm the extension matches the actual output (`.mp4` or `.webm`) and play it in a media player.
6. Confirm the final status explicitly says browser speech preview is not embedded as audio.

## Test checklist
- [ ] All four JavaScript files load with no syntax errors.
- [ ] Missing scene image stops rendering with a scene-specific error.
- [ ] Valid scene durations determine the timeline length.
- [ ] Each aspect ratio sets the expected canvas dimensions.
- [ ] Progress status changes during image loading and rendering.
- [ ] Download extension matches recorder MIME type; WebM is never renamed MP4.
- [ ] Unsupported MediaRecorder/MIME support produces a clear error.
- [ ] Recording errors and zero-byte output are not reported as success.
- [ ] Stream tracks and animation frame are cleaned up on completion/failure.
- [ ] No claim is made that narration audio is embedded.
- [ ] Existing project creation, editing, image generation and storage still work after integration.

## Syntax checks performed
The JavaScript files are plain scripts and have no build step or external dependencies. Validate locally with a JavaScript parser such as `node --check filename.js` if Node is available, or open the browser console after deployment. The ZIP is a source package; full live-browser integration tests must be completed against the actual project and generated images.
