(function (global) {
  "use strict";

  const DEFAULTS = { fps: 30, transition: 0.65 };
  const $ = id => document.getElementById(id);

  function getProject() {
    if (!global.ScienceStudio ||
        typeof global.ScienceStudio.getCurrentProject !== "function") {
      throw new Error("The project connection is missing. Check the ScienceStudio bridge in index.html.");
    }
    return global.ScienceStudio.getCurrentProject();
  }

  function dimensions(ratio) {
    if (ratio === "9:16") return { width: 720, height: 1280 };
    if (ratio === "1:1") return { width: 1080, height: 1080 };
    return { width: 1280, height: 720 };
  }

  function supportedTypes() {
    if (!global.MediaRecorder || typeof global.MediaRecorder.isTypeSupported !== "function") {
      return [];
    }
    return [
      "video/mp4;codecs=h264,aac",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ].filter(type => global.MediaRecorder.isTypeSupported(type));
  }

  function chooseMime(preference) {
    const types = supportedTypes();
    if (preference === "mp4") {
      return types.find(type => type.toLowerCase().includes("mp4")) || null;
    }
    if (preference === "webm") {
      return types.find(type => type.toLowerCase().includes("webm")) || null;
    }
    return types[0] || null;
  }

  function extension(mime) {
    return mime && mime.toLowerCase().includes("mp4") ? ".mp4" : ".webm";
  }

  function loadImage(scene, index) {
    return new Promise((resolve, reject) => {
      const source = scene.imageData || scene.imageUrl || scene.image ||
        scene.generatedImage;
      if (!source) {
        reject(new Error("Scene " + (index + 1) + " (“" +
          (scene.title || "Untitled") + "”) has no image. Generate an image for this scene first."));
        return;
      }
      const image = new Image();
      image.onload = () => image.naturalWidth
        ? resolve(image)
        : reject(new Error("Scene " + (index + 1) + " has an empty image."));
      image.onerror = () => reject(new Error(
        "The image for scene " + (index + 1) +
        " could not be loaded. Check the image URL or generate the image again."
      ));
      image.src = source;
    });
  }
const NARRATION_API =
  "https://ai-science-cartoon-studio-api.ddangote701.workers.dev";

async function generateNarrationAudio(text, audioContext, voice) {
  if (!text || !text.trim()) {
    return null;
  }

  const response = await fetch(NARRATION_API + "/narrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: text.trim(),
      voice: voice || "Kore"
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "The AI voice could not be generated."
    );
  }

  if (!data.audioBase64) {
    throw new Error(
      "The AI voice service returned no audio."
    );
  }

  const binary = atob(data.audioBase64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return await audioContext.decodeAudioData(
    bytes.buffer
  );
}
  function wrapText(ctx, text, maxWidth, maxLines) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach(word => {
      const candidate = (line + " " + word).trim();
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, maxLines);
  }

  function drawTitle(ctx, title, width, height, ratio) {
    if (!title) return;
    const fontSize = Math.max(20, Math.round(width * (ratio === "9:16" ? 0.045 : 0.034)));
    ctx.save();
    ctx.font = "700 " + fontSize + "px system-ui, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = wrapText(ctx, title, width * 0.84, 2);
    if (lines.length) {
      const lineHeight = fontSize * 1.2;
      const pad = fontSize * 0.45;
      const boxHeight = lines.length * lineHeight + pad * 2;
      const boxWidth = Math.min(width * 0.9,
        Math.max.apply(null, lines.map(line => ctx.measureText(line).width)) + pad * 2);
      const x = (width - boxWidth) / 2;
      const y = height * 0.045;
      ctx.fillStyle = "rgba(4,14,27,.78)";
      ctx.fillRect(x, y, boxWidth, boxHeight);
      ctx.fillStyle = "#fff";
      lines.forEach((line, index) =>
        ctx.fillText(line, width / 2, y + pad + lineHeight * (index + 0.5), boxWidth - pad));
    }
    ctx.restore();
  }

  function drawSubtitles(ctx, text, width, height, ratio) {
    if (!text || !global.ScienceStudioSubtitles) return;
    global.ScienceStudioSubtitles.draw(ctx, text, width, height, ratio);
  }

  function getMotion(scene) {
    const camera = String(scene.camera || "").toLowerCase();
    if (camera.includes("left")) return "panLeft";
    if (camera.includes("right")) return "panRight";
    if (camera.includes("up")) return "panUp";
    if (camera.includes("down")) return "panDown";
    if (camera.includes("out")) return "zoomOut";
    return "cinematic";
  }

  async function render(options) {
    options = options || {};
    const ui = options.ui || {};
    const update = (percent, message) => {
      if (ui.progressFill) ui.progressFill.style.width = percent + "%";
      if (ui.percent) ui.percent.textContent = Math.round(percent) + "%";
      if (ui.status) ui.status.textContent = message;
      if (ui.progressBar) ui.progressBar.setAttribute("aria-valuenow", String(Math.round(percent)));
      if (ui.error) {
        ui.error.textContent = "";
        ui.error.hidden = true;
      }
    };

    let recorder = null;
    let stream = null;
    let animationFrame = 0;
    let outputUrl = null;

    try {
      if (!global.MediaRecorder) {
        throw new Error("This browser does not support video recording. Try a recent version of desktop Chrome or Edge.");
      }
      const project = getProject();
      if (!project) throw new Error("Create or open a project first.");
      const scenes = Array.isArray(project.scenes) ? project.scenes : [];
      if (!scenes.length) throw new Error("This project has no scenes.");

      const ratio = ["16:9", "9:16", "1:1"].includes(options.ratio)
        ? options.ratio : "16:9";
      const preference = ["auto", "mp4", "webm"].includes(options.outputFormat)
        ? options.outputFormat : "auto";
      const mime = chooseMime(preference);

      if (!mime) {
        if (preference === "mp4") {
          throw new Error("This browser does not support MP4 recording. Choose Automatic or WebM, or use a compatible desktop browser.");
        }
        if (preference === "webm") {
          throw new Error("This browser does not support WebM recording. Choose Automatic or MP4, or use a compatible desktop browser.");
        }
        throw new Error("This browser does not report a supported MP4 or WebM recording format.");
      }

      update(2, "Checking scenes and browser recording support…");
      const images = [];
      for (let i = 0; i < scenes.length; i++) {
        update(3 + (15 * i / scenes.length), "Loading image " + (i + 1) + " of " + scenes.length + "…");
        images.push(await loadImage(scenes[i], i));
      }

      if (!global.ScienceStudioAnimation ||
          typeof global.ScienceStudioAnimation.draw !== "function") {
        throw new Error("The animation.js module did not load.");
      }

      const size = dimensions(ratio);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas drawing is unavailable in this browser.");
      if (typeof canvas.captureStream !== "function") {
        throw new Error("This browser does not support canvas video capture.");
      }

      const AudioContextClass =
  global.AudioContext || global.webkitAudioContext;
if (!AudioContextClass) {
  throw new Error(
    "Audio recording is not supported by this browser."
  );
}
const audioContext = new AudioContextClass();
await audioContext.resume();
const audioDestination =
  audioContext.createMediaStreamDestination();
const narrationAudios = [];
update(17, "Generating AI narration...");
for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const narration = String(
    scene.narration ||
    scene.caption ||
    scene.onScreen ||
    ""
  ).trim();
  if (!narration) {
    narrationAudios.push(null);
    continue;
  }
  update(
    17 + (2 * i / scenes.length),
    "Generating voice for scene " +
      (i + 1) + " of " + scenes.length + "..."
  );
  const audio = await generateNarrationAudio(
    narration,
    audioContext
  );
  narrationAudios.push(audio);
}
stream = canvas.captureStream(DEFAULTS.fps);
audioDestination.stream
  .getAudioTracks()
  .forEach(track => stream.addTrack(track));
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5000000 });
      const chunks = [];
      let recorderError = null;

      recorder.ondataavailable = event => {
        if (event.data && event.data.size) chunks.push(event.data);
      };
      recorder.onerror = event => {
        recorderError = event.error || new Error("The browser video recorder failed.");
      };

      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = () => recorderError ? reject(recorderError) : resolve();
      });

      const durations = scenes.map((scene, index) =>
  Math.max(
    1,
    Math.min(
      60,
      Math.max(
        Number(scene.duration) || 5,
        narrationAudios[index]
          ? narrationAudios[index].duration + 0.5
          : 0
      )
    )
  )
);
      const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
      const transition = Math.min(DEFAULTS.transition, Math.min.apply(null, durations) / 3);
      let elapsedBeforeScene = 0;
      let lastProgress = 0;

      recorder.start(1000);
      update(20, "Rendering video frames…");

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const image = images[i];
        const duration = durations[i];
        let narrationSource = null;

const narrationAudio = narrationAudios[i];

if (narrationAudio) {
  narrationSource = audioContext.createBufferSource();

  narrationSource.buffer = narrationAudio;

  narrationSource.connect(audioDestination);

  narrationSource.start();
}
        const start = performance.now();
        const narration = String(scene.narration || scene.caption || scene.onScreen || "").trim();
        const subtitleSegments = global.ScienceStudioSubtitles
          ? global.ScienceStudioSubtitles.segments(narration, duration) : [];

        await new Promise(resolve => {
          const frame = now => {
            const t = Math.min(1, (now - start) / (duration * 1000));
            context.fillStyle = "#07111f";
            context.fillRect(0, 0, size.width, size.height);

            const fadeIn = i === 0 ? 1 : Math.min(1, (now - start) / (transition * 1000));
            const fadeOut = i === scenes.length - 1 ? 1 :
              Math.min(1, (duration * 1000 - (now - start)) / (transition * 1000));
            global.ScienceStudioAnimation.draw(
              context, image, size.width, size.height, getMotion(scene),
              t, Math.max(0, Math.min(fadeIn, fadeOut))
            );
            drawTitle(context, scene.title, size.width, size.height, ratio);

            const localSeconds = (now - start) / 1000;
            const segment = subtitleSegments.find(item =>
              localSeconds >= item.start && localSeconds < item.end);
            if (segment) drawSubtitles(context, segment.text, size.width, size.height, ratio);

            const progress = 20 + 78 *
              ((elapsedBeforeScene + t * duration) / totalDuration);
            if (progress - lastProgress >= 0.35 || t === 1) {
              lastProgress = progress;
              update(progress, "Rendering scene " + (i + 1) + " of " + scenes.length + "…");
            }

            if (t < 1) animationFrame = requestAnimationFrame(frame);
            else resolve();
          };
          animationFrame = requestAnimationFrame(frame);
        });

        elapsedBeforeScene += duration;
      }

      cancelAnimationFrame(animationFrame);
      recorder.stop();
      await stopped;

      const blob = new Blob(chunks, { type: recorder.mimeType || mime });
      if (!blob.size) throw new Error("The browser produced an empty video. Try fewer scenes or a different browser.");

      outputUrl = URL.createObjectURL(blob);
      const safeTitle = String(project.title || project.name || project.topic || "science-video")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "science-video";
      const filename = safeTitle + extension(blob.type || mime);

      if (ui.preview) {
        ui.preview.src = outputUrl;
        ui.preview.style.display = "block";
        ui.preview.hidden = false;
        ui.preview.load();
      }
      if (ui.download) {
        ui.download.href = outputUrl;
        ui.download.download = filename;
        ui.download.style.display = "inline-flex";
        ui.download.hidden = false;
      }

      update(100, "Video ready: " + filename + ". AI narration is included.");
      return {
        blob,
        url: outputUrl,
        filename,
        mime: blob.type || mime,
        hasNarrationAudio: narrationAudios.some(Boolean)
      };
    } catch (error) {
      cancelAnimationFrame(animationFrame);
      if (recorder && recorder.state !== "inactive") {
        try { recorder.stop(); } catch (_) {}
      }
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const message = error && error.message ? error.message : String(error);
      update(0, "Rendering failed: " + message);
      if (ui.error) {
        ui.error.textContent = message;
        ui.error.hidden = false;
        ui.error.style.display = "block";
      }
      throw error;
    } finally {
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  }

  function connect(options) {
    options = options || {};
    const ui = {
      progressFill: $("rendererProgressFill"),
      percent: $("rendererPercent"),
      status: $("rendererStatus"),
      progressBar: $("rendererProgressBar"),
      preview: $("rendererPreview"),
      download: $("rendererDownload"),
      error: $("rendererError")
    };
    Object.assign(ui, options.ui || {});

    const button = $(options.buttonId || "renderVideoButton");
    if (!button) return false;
    if (button.dataset.rendererBound === "1") return true;
    button.dataset.rendererBound = "1";

    button.addEventListener("click", async () => {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      if (ui.download) {
        ui.download.hidden = true;
        ui.download.style.display = "none";
      }
      if (ui.preview) {
        ui.preview.pause();
        ui.preview.removeAttribute("src");
        ui.preview.load();
        ui.preview.hidden = true;
        ui.preview.style.display = "none";
      }
      try {
        await render({
          ratio: $(options.ratioId || "rendererRatio")?.value || "16:9",
          outputFormat: $(options.formatId || "rendererFormat")?.value || "auto",
          ui
        });
      } catch (_) {
        // A helpful error message is displayed in the renderer panel.
      } finally {
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
    });
    return true;
  }

  global.ScienceStudioVideoRenderer = {
    render,
    connect,
    supportedTypes,
    dimensions
  };
})(window);
