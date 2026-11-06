/* AI Cartoon Teacher Studio — safe integration starter
   Adds a floating lesson-planner panel to the existing Science Studio.
   Photo stays in this browser. Cartoon conversion requires a configured,
   consent-based image-to-image endpoint; this module does not fake it.
*/
(function () {
  "use strict";
  if (window.AICartoonTeacherStudio) return;

  const state = { photoUrl: "", duration: 180, topic: "", script: "" };
  const $ = (id) => document.getElementById(id);

  function addStyles() {
    if ($("ai-cartoon-teacher-styles")) return;
    const style = document.createElement("style");
    style.id = "ai-cartoon-teacher-styles";
    style.textContent = `
      #aiTeacherLauncher{position:fixed;right:16px;bottom:18px;z-index:9998;border:0;border-radius:999px;padding:13px 18px;background:#6d5dfc;color:white;font-weight:800;box-shadow:0 8px 28px #17104455;cursor:pointer}
      #aiTeacherPanel{position:fixed;z-index:9999;right:12px;bottom:76px;width:min(460px,calc(100vw - 24px));max-height:82vh;overflow:auto;background:#101827;color:#f8fafc;border:1px solid #334155;border-radius:20px;box-shadow:0 20px 70px #0008;padding:18px;display:none;font:14px/1.5 system-ui,sans-serif}
      #aiTeacherPanel *{box-sizing:border-box}
      #aiTeacherPanel h2{font-size:20px;margin:0 0 4px}
      #aiTeacherPanel .muted{color:#b8c4d8;font-size:12px}
      #aiTeacherPanel label{display:block;margin:13px 0 6px;font-weight:700}
      #aiTeacherPanel input,#aiTeacherPanel select,#aiTeacherPanel textarea{width:100%;padding:11px;border:1px solid #475569;border-radius:10px;background:#1e293b;color:#fff}
      #aiTeacherPanel textarea{min-height:115px;resize:vertical}
      #aiTeacherPanel .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #aiTeacherPanel button.action{border:0;border-radius:10px;padding:11px 14px;background:#6d5dfc;color:white;font-weight:800;cursor:pointer;margin:10px 6px 0 0}
      #aiTeacherPanel button.secondary{background:#334155}
      #aiTeacherPanel .preview{margin-top:10px;min-height:90px;border:1px dashed #64748b;border-radius:12px;padding:10px;text-align:center}
      #aiTeacherPanel .preview img{max-width:100%;max-height:190px;border-radius:10px}
      #aiTeacherPanel .notice{background:#1e3a5f;padding:10px;border-radius:10px;color:#dbeafe;font-size:12px;margin-top:10px}
      #aiTeacherPanel .status{font-size:12px;color:#a7f3d0;min-height:18px;margin-top:8px}
      @media(max-width:480px){#aiTeacherPanel{right:8px;bottom:70px;width:calc(100vw - 16px)}}
    `;
    document.head.appendChild(style);
  }

  function estimateWords(seconds) {
    // Planning estimate only: roughly 125–140 spoken words per minute.
    return Math.round(seconds / 60 * 130);
  }

  function buildScenePlan(script, seconds) {
    const paragraphs = script.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    const count = Math.max(1, Math.ceil(seconds / 12));
    const chunks = paragraphs.length ? paragraphs : ["Add a teaching point for this scene."];
    return Array.from({ length: count }, (_, i) => ({
      scene: i + 1,
      target_seconds: Math.min(12, seconds - i * 12),
      teaching_point: chunks[i] || "Continue the explanation with an example or visual demonstration."
    }));
  }

  function render() {
    addStyles();
    if ($("aiTeacherLauncher")) return;
    const launcher = document.createElement("button");
    launcher.id = "aiTeacherLauncher";
    launcher.type = "button";
    launcher.textContent = "🎬 Cartoon Teacher";
    const panel = document.createElement("section");
    panel.id = "aiTeacherPanel";
    panel.setAttribute("aria-label", "AI Cartoon Teacher Studio");
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:start">
        <div><h2>🎬 AI Cartoon Teacher Studio</h2><div class="muted">Plan a lesson starring your cartoon avatar.</div></div>
        <button type="button" id="aiTeacherClose" class="action secondary" aria-label="Close">✕</button>
      </div>
      <label for="aiTeacherPhoto">1. Upload your photo</label>
      <input id="aiTeacherPhoto" type="file" accept="image/*">
      <div class="preview" id="aiTeacherPhotoPreview">Your photo preview will appear here.</div>
      <div class="notice">Privacy: the photo preview stays in this browser. Do not upload someone else's image without their permission. Cartoon conversion is not activated until an approved image-to-image service is connected.</div>
      <label for="aiTeacherTopic">2. What will you teach?</label>
      <input id="aiTeacherTopic" type="text" placeholder="Example: How the human heart works">
      <div class="row">
        <div><label for="aiTeacherDuration">3. Lesson duration</label>
          <select id="aiTeacherDuration">
            <option value="30">30 seconds</option><option value="60">1 minute</option>
            <option value="180" selected>3 minutes</option><option value="300">5 minutes</option>
            <option value="600">10 minutes</option><option value="900">15 minutes</option>
            <option value="1800">30 minutes</option>
          </select>
        </div>
        <div><label for="aiTeacherFormat">Video format</label>
          <select id="aiTeacherFormat"><option value="16:9">Landscape 16:9</option><option value="9:16">Portrait 9:16</option><option value="1:1">Square 1:1</option></select>
        </div>
      </div>
      <label for="aiTeacherScript">4. Teaching script</label>
      <textarea id="aiTeacherScript" placeholder="Paste or write the lesson script here. The script should be reviewed for accuracy before video generation."></textarea>
      <div class="muted" id="aiTeacherWordGuide">Suggested narration: about 390 words for a 3-minute lesson.</div>
      <button type="button" class="action" id="aiTeacherPlan">Create scene plan</button>
      <button type="button" class="action" id="aiTeacherImport" disabled>
       Send to Science Studio
      </button>
      <button type="button" class="action secondary" id="aiTeacherExport">Export lesson plan</button>
      <div class="status" id="aiTeacherStatus" role="status"></div>
      <pre id="aiTeacherScenePlan" style="white-space:pre-wrap;color:#dbeafe;font-size:12px"></pre>
      <div class="notice">Next integration step: connect a consent-based photo-to-cartoon endpoint, a talking-avatar/video service, narration audio, and the existing Science Studio renderer. This starter creates the duration-aware lesson plan; it does not claim to render a finished talking-avatar video yet.</div>
    `;
    document.body.append(launcher, panel);
    launcher.addEventListener("click", () => panel.style.display = "block");
    $("aiTeacherClose").addEventListener("click", () => panel.style.display = "none");
    $("aiTeacherPhoto").addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      const preview = $("aiTeacherPhotoPreview");
      if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
      state.photoUrl = "";
      preview.replaceChildren();
      if (!file) { preview.textContent = "Your photo preview will appear here."; return; }
      if (!file.type.startsWith("image/")) {
        preview.textContent = "Please choose an image file.";
        event.target.value = "";
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        preview.textContent = "Please choose an image smaller than 12 MB.";
        event.target.value = "";
        return;
      }
      state.photoUrl = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = state.photoUrl;
      img.alt = "Uploaded photo preview";
      preview.appendChild(img);
    });
    $("aiTeacherDuration").addEventListener("change", updateWordGuide);
    $("aiTeacherPlan").addEventListener("click", () => {
      const topic = $("aiTeacherTopic").value.trim();
      const script = $("aiTeacherScript").value.trim();
      const seconds = Number($("aiTeacherDuration").value);
      if (!topic) { $("aiTeacherStatus").textContent = "Enter a lesson topic first."; return; }
      if (!script) { $("aiTeacherStatus").textContent = "Add or paste a teaching script first."; return; }
      state.topic = topic; state.script = script; state.duration = seconds;
      const plan = {
        project_type: "AI Cartoon Teacher lesson",
        topic,
        target_duration_seconds: seconds,
        video_format: $("aiTeacherFormat").value,
        suggested_narration_words: estimateWords(seconds),
        actual_script_words: script.split(/\s+/).filter(Boolean).length,
        scenes: buildScenePlan(script, seconds)
      };
      $("aiTeacherScenePlan").textContent = JSON.stringify(plan, null, 2);
      $("aiTeacherStatus").textContent = "Scene plan created. Review the timing and teaching points.";
      state.plan = plan;
       $("aiTeacherImport").disabled = false;
    });
     $("aiTeacherImport").addEventListener("click", () => {
  if (!state.plan) {
    $("aiTeacherStatus").textContent = "Create a scene plan first.";
    return;
  }

  if (!window.ScienceStudio ||
      typeof window.ScienceStudio.importLessonPlan !== "function") {
    $("aiTeacherStatus").textContent =
      "Science Studio import connection is unavailable.";
    return;
  }

  try {
    window.ScienceStudio.importLessonPlan(state.plan);
    $("aiTeacherStatus").textContent =
      "Lesson successfully sent to Science Studio!";
  } catch (error) {
    $("aiTeacherStatus").textContent =
      error.message || "Could not import the lesson.";
  }
});
    $("aiTeacherExport").addEventListener("click", () => {
      if (!state.plan) { $("aiTeacherStatus").textContent = "Create a scene plan first."; return; }
      const blob = new Blob([JSON.stringify(state.plan, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "cartoon-teacher-lesson-plan.json"; a.click();
      URL.revokeObjectURL(url);
    });
    updateWordGuide();
  }

  function updateWordGuide() {
    const seconds = Number($("aiTeacherDuration").value);
    $("aiTeacherWordGuide").textContent =
      "Suggested narration: about " + estimateWords(seconds) + " words for this duration (at roughly 130 words per minute).";
  }

  window.AICartoonTeacherStudio = Object.freeze({ open: render });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
