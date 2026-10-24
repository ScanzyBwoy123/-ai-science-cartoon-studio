(function () {
  "use strict";
  const Clips = window.ScienceStudioPresenterClips;
  if (!Clips) {
    console.error(
      "Presenter clips storage is missing. Load presenter-clips.js first."
    );
    return;
  }
  const STYLE_ID = "presenter-clips-ui-styles";
  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .presenter-panel {
        margin: 0 13px 14px;
        padding: 16px;
        border: 1px solid #31516c;
        border-radius: 13px;
        background: linear-gradient(135deg, #10263b, #0b1928);
      }
      .presenter-panel h3 {
        margin: 0 0 7px;
        color: #eaf4ff;
        font-size: 16px;
      }
      .presenter-description {
        color: #9bb0c8;
        font-size: 12px;
        margin-bottom: 12px;
      }
      .presenter-panel input[type="file"] {
        display: block;
        width: 100%;
        margin: 12px 0;
        padding: 10px;
        border: 1px solid #31516c;
        border-radius: 9px;
        background: #081625;
        color: #eaf4ff;
        font-size: 12px;
      }
      .presenter-preview {
        display: block;
        width: 100%;
        max-height: 320px;
        margin-top: 12px;
        background: #000;
        border-radius: 10px;
        object-fit: contain;
      }
      .presenter-status {
        color: #45e0c1;
        font-size: 12px;
        overflow-wrap: anywhere;
        margin: 10px 0;
      }
      .presenter-remove {
        color: #ffb2bb;
      }
      .presenter-hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
  function createButton(label, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = className || "";
    return button;
  }
  function createPanel(sceneId) {
    const panel = document.createElement("section");
    panel.className = "presenter-panel";
    panel.dataset.presenterPanel = sceneId;
    const heading = document.createElement("h3");
    heading.textContent = "🎥 Human Presenter";
    const description = document.createElement("p");
    description.className = "presenter-description";
    description.textContent =
      "Upload a short video of a presenter explaining this scene. " +
      "The original clip audio stays muted so your narration can play separately.";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4,video/webm,video/quicktime,video/*";
    input.setAttribute("aria-label", "Upload presenter video");
    const status = document.createElement("p");
    status.className = "presenter-status";
    status.textContent = "No presenter video selected.";
    const preview = document.createElement("video");
    preview.className = "presenter-preview presenter-hidden";
    preview.controls = true;
    preview.muted = true;
    preview.playsInline = true;
    preview.preload = "metadata";
    const removeButton = createButton(
      "Remove presenter video",
      "presenter-remove"
    );
    removeButton.hidden = true;
    panel.append(
      heading,
      description,
      input,
      status,
      preview,
      removeButton
    );
    let currentUrl = null;
    let operation = 0;
    function clearPreview() {
      preview.pause();
      preview.removeAttribute("src");
      preview.load();
      preview.classList.add("presenter-hidden");
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
        currentUrl = null;
      }
    }
    function showClip(record) {
      clearPreview();
      if (!record || !record.blob) {
        status.textContent = "No presenter video selected.";
        removeButton.hidden = true;
        return;
      }
      currentUrl = URL.createObjectURL(record.blob);
      preview.src = currentUrl;
      preview.classList.remove("presenter-hidden");
      preview.load();
      status.textContent =
        "Saved: " + record.fileName +
        " · " + Clips.formatFileSize(record.fileSize);
      removeButton.hidden = false;
    }
    input.addEventListener("change", async function () {
      const file = input.files && input.files[0];
      if (!file) return;
      const thisOperation = ++operation;
      try {
        status.textContent = "Saving presenter video…";
        input.disabled = true;
        await Clips.saveClip(sceneId, file);
        if (thisOperation !== operation) return;
        const saved = await Clips.getClip(sceneId);
        showClip(saved);
        status.textContent =
          "✅ Presenter video saved: " + file.name +
          " · " + Clips.formatFileSize(file.size);
      } catch (error) {
        status.textContent =
          "Could not save video: " + error.message;
      } finally {
        input.disabled = false;
        input.value = "";
      }
    });
    removeButton.addEventListener("click", async function () {
      if (!confirm("Remove the presenter video from this scene?")) {
        return;
      }
      try {
        removeButton.disabled = true;
        await Clips.removeClip(sceneId);
        clearPreview();
        status.textContent = "Presenter video removed.";
        removeButton.hidden = true;
      } catch (error) {
        status.textContent =
          "Could not remove video: " + error.message;
      } finally {
        removeButton.disabled = false;
      }
    });
    Clips.getClip(sceneId)
      .then(showClip)
      .catch(function (error) {
        status.textContent =
          "Could not load saved video: " + error.message;
      });
    return panel;
  }
  function enhanceScene(scene) {
    if (!scene || scene.dataset.presenterEnhanced === "1") return;
    const imageButton = scene.querySelector("[data-generate-image]");
    const sceneGrid = scene.querySelector(".scenegrid");
    if (!imageButton || !sceneGrid) return;
    const sceneId = imageButton.dataset.generateImage;
    if (!sceneId) return;
    const panel = createPanel(sceneId);
    sceneGrid.insertAdjacentElement("afterend", panel);
    scene.dataset.presenterEnhanced = "1";
  }
  function scanScenes() {
    document.querySelectorAll("#scenes .scene").forEach(enhanceScene);
  }
  function start() {
    addStyles();
    scanScenes();
    const container = document.getElementById("scenes");
    if (container) {
      const observer = new MutationObserver(scanScenes);
      observer.observe(container, {
        childList: true,
        subtree: true
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
