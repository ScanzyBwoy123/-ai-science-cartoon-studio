/* Science Studio Human Presenter UI */
(function () {
  "use strict";
  function start() {
    const clips = window.ScienceStudioPresenterClips;
    if (!clips) {
      console.error(
        "Presenter clip storage has not loaded. Check presenter-clips.js."
      );
      return;
    }
    if (document.getElementById("presenter-ui-styles")) return;
    const style = document.createElement("style");
    style.id = "presenter-ui-styles";
    style.textContent = `
      .presenter-panel {
        margin-top: 18px;
        padding: 20px;
        border: 1px solid #dbe5f2;
        border-radius: 18px;
        background: linear-gradient(145deg, #ffffff, #f1f6ff);
        color: #172033;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      }
      .presenter-panel h3 {
        margin: 0 0 8px;
        font-size: 18px;
      }
      .presenter-panel p {
        font-size: 13px;
        line-height: 1.65;
        color: #536176;
      }
      .presenter-panel label {
        display: block;
        margin-top: 14px;
        font-size: 14px;
      }
      .presenter-panel input[type="file"] {
        display: block;
        box-sizing: border-box;
        width: 100%;
        margin-top: 10px;
        padding: 10px;
        border: 1px solid #dbe5f2;
        border-radius: 10px;
        background: #fff;
      }
      .presenter-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 14px 0;
      }
      .presenter-actions button {
        border: 0;
        border-radius: 10px;
        padding: 12px 15px;
        cursor: pointer;
        font-weight: 600;
      }
      .presenter-save {
        background: #2563eb;
        color: #fff;
      }
      .presenter-save:disabled {
        opacity: 0.6;
        cursor: wait;
      }
      .presenter-delete {
        background: #fee2e2;
        color: #991b1b;
      }
      .presenter-status {
        margin: 10px 0;
        font-size: 13px;
        line-height: 1.5;
      }
      .presenter-preview video {
        display: block;
        width: 100%;
        max-height: 380px;
        margin-top: 12px;
        border-radius: 12px;
        background: #101827;
      }
      .presenter-note {
        padding: 12px;
        border-radius: 10px;
        background: #eaf2ff;
      }
      .presenter-badge {
        display: inline-block;
        margin-left: 6px;
        padding: 4px 8px;
        border-radius: 20px;
        background: #dbeafe;
        color: #1d4ed8;
        font-size: 11px;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
    function showStatus(panel, message, isError) {
      const status = panel.querySelector(".presenter-status");
      status.textContent = message;
      status.style.color = isError ? "#b91c1c" : "#166534";
    }
    async function loadSavedClip(panel, sceneId) {
      const preview = panel.querySelector(".presenter-preview");
      preview.replaceChildren();
      try {
        const clip = await clips.getClip(sceneId);
        if (!clip) {
          preview.textContent =
            "No presenter video saved for this scene yet.";
          return;
        }
        const video = clips.createVideoElement(clip);
        if (video) {
          video.controls = true;
          video.playsInline = true;
          preview.appendChild(video);
        }
        const details = document.createElement("p");
        details.textContent =
          "Saved video: " +
          clip.name +
          " · " +
          clips.formatFileSize(clip.size);
        preview.prepend(details);
        showStatus(
          panel,
          "Presenter video is saved in this browser.",
          false
        );
      } catch (error) {
        console.error("Could not load presenter video:", error);
        showStatus(
          panel,
          "Could not load the saved video. Check presenter-clips.js.",
          true
        );
      }
    }
    function createPanel(scene, sceneId) {
      const panel = document.createElement("section");
      panel.className = "presenter-panel";
      panel.dataset.presenterScene = sceneId;
      panel.innerHTML = `
        <h3>
          🎬 Human Presenter
          <span class="presenter-badge">SCENE VIDEO</span>
        </h3>
        <p>
          Add a video of a science teacher or presenter to this scene.
          You can preview the video and save it for later editing.
        </p>
        <p class="presenter-note">
          <strong>Storage:</strong> Videos are saved locally in this
          browser. They are not uploaded to a server. Maximum file size:
          100 MB.
        </p>
        <label>
          <strong>Choose a presenter video</strong>
          <input type="file" accept="video/*">
        </label>
        <div class="presenter-actions">
          <button type="button" class="presenter-save">
            💾 Save video
          </button>
          <button type="button" class="presenter-delete">
            🗑️ Remove saved video
          </button>
        </div>
        <div
          class="presenter-status"
          role="status"
          aria-live="polite"
        >
          Choose a video to get started.
        </div>
        <div class="presenter-preview"></div>
      `;
      const input = panel.querySelector('input[type="file"]');
      const saveButton = panel.querySelector(".presenter-save");
      const deleteButton = panel.querySelector(".presenter-delete");
      const preview = panel.querySelector(".presenter-preview");
      let temporaryVideoUrl = null;
      input.addEventListener("change", function () {
        const file = input.files && input.files[0];
        if (!file) return;
        if (!file.type.startsWith("video/")) {
          showStatus(panel, "Please select a valid video file.", true);
          input.value = "";
          return;
        }
        if (file.size > 100 * 1024 * 1024) {
          showStatus(
            panel,
            "The video is too large. Choose a video under 100 MB.",
            true
          );
          input.value = "";
          return;
        }
        if (temporaryVideoUrl) {
          URL.revokeObjectURL(temporaryVideoUrl);
        }
        temporaryVideoUrl = URL.createObjectURL(file);
        preview.replaceChildren();
        const video = document.createElement("video");
        video.src = temporaryVideoUrl;
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        preview.appendChild(video);
        showStatus(
          panel,
          "Video selected. Preview it, then tap Save video.",
          false
        );
      });
      saveButton.addEventListener("click", async function () {
        const file = input.files && input.files[0];
        if (!file) {
          showStatus(
            panel,
            "Choose a video file before saving.",
            true
          );
          return;
        }
        saveButton.disabled = true;
        showStatus(panel, "Saving presenter video...", false);
        try {
          await clips.saveClip(sceneId, file);
          showStatus(
            panel,
            "Presenter video saved successfully.",
            false
          );
          await loadSavedClip(panel, sceneId);
        } catch (error) {
          console.error("Could not save presenter video:", error);
          showStatus(
            panel,
            error.message || "Could not save the video.",
            true
          );
        } finally {
          saveButton.disabled = false;
        }
      });
      deleteButton.addEventListener("click", async function () {
        deleteButton.disabled = true;
        try {
          await clips.removeClip(sceneId);
          input.value = "";
          preview.replaceChildren();
          showStatus(
            panel,
            "Saved presenter video removed.",
            false
          );
        } catch (error) {
          console.error("Could not remove presenter video:", error);
          showStatus(
            panel,
            "Could not remove the saved video.",
            true
          );
        } finally {
          deleteButton.disabled = false;
        }
      });
      loadSavedClip(panel, sceneId);
      return panel;
    }
    function scanScenes() {
      const scenes = document.querySelectorAll("#scenes .scene");
      scenes.forEach(function (scene) {
        if (scene.querySelector(".presenter-panel")) return;
        const field = scene.querySelector("[data-id]");
        const sceneId = field && field.dataset.id;
        const grid = scene.querySelector(".scenegrid");
        if (!sceneId || !grid) return;
        grid.insertAdjacentElement(
          "afterend",
          createPanel(scene, sceneId)
        );
      });
    }
    scanScenes();
    const observer = new MutationObserver(scanScenes);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log("Science Studio Human Presenter UI loaded.");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
