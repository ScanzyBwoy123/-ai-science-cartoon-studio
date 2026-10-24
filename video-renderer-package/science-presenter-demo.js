/* Science Studio — Animated Science Presenter
   Browser-based prototype. No paid API required. */

(function () {
  "use strict";

  const STYLE_ID = "science-presenter-demo-styles";

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      .science-presenter-demo {
        margin-top: 18px;
        padding: 18px;
        border-radius: 18px;
        background: linear-gradient(135deg, #0f172a, #172554);
        color: #f8fafc;
        overflow: hidden;
      }

      .science-presenter-demo h3 {
        color: #ffffff;
        margin: 0 0 8px;
      }

      .science-presenter-demo p {
        color: #cbd5e1;
        font-size: 13px;
        line-height: 1.6;
      }

      .presenter-stage {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        align-items: end;
        min-height: 230px;
        padding: 16px 8px 8px;
        border-radius: 14px;
        background:
          radial-gradient(circle at 75% 35%, #1d4ed8 0, transparent 38%),
          linear-gradient(160deg, #172554, #020617);
      }

      .presenter-person {
        position: relative;
        height: 190px;
        animation: presenter-breathe 3s ease-in-out infinite;
        transform-origin: bottom center;
      }

      .presenter-head {
        position: absolute;
        z-index: 2;
        width: 76px;
        height: 88px;
        top: 5px;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 44% 44% 48% 48%;
        background: linear-gradient(110deg, #a96e4c, #dca17b);
        box-shadow: inset -8px -2px 0 rgba(80, 35, 20, .12);
      }

      .presenter-hair {
        position: absolute;
        top: -7px;
        left: -2px;
        width: 80px;
        height: 35px;
        border-radius: 50% 50% 25% 25%;
        background: #172033;
      }

      .presenter-eyes {
        position: absolute;
        top: 37px;
        left: 16px;
        width: 45px;
        display: flex;
        justify-content: space-between;
      }

      .presenter-eyes span {
        width: 7px;
        height: 5px;
        border-radius: 50%;
        background: #172033;
      }

      .presenter-mouth {
        position: absolute;
        top: 61px;
        left: 30px;
        width: 17px;
        height: 4px;
        border-radius: 50%;
        background: #713b35;
      }

      .science-presenter-demo.is-speaking .presenter-mouth {
        animation: presenter-talk .22s ease-in-out infinite alternate;
      }

      .presenter-neck {
        position: absolute;
        z-index: 1;
        top: 79px;
        left: calc(50% - 12px);
        width: 24px;
        height: 27px;
        background: #b87d5a;
      }

      .presenter-coat {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 132px;
        height: 105px;
        transform: translateX(-50%);
        border-radius: 30px 30px 8px 8px;
        background: linear-gradient(100deg, #dbeafe, #ffffff, #bfdbfe);
        clip-path: polygon(15% 0, 38% 0, 50% 20%, 62% 0, 85% 0, 100% 100%, 0 100%);
      }

      .presenter-shirt {
        position: absolute;
        top: 5px;
        left: 48px;
        width: 36px;
        height: 90px;
        background: #2563eb;
        clip-path: polygon(0 0, 100% 0, 70% 100%, 30% 100%);
      }

      .science-visual {
        display: flex;
        min-height: 160px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .science-heart {
        font-size: 66px;
        filter: drop-shadow(0 0 14px rgba(248, 113, 113, .45));
        animation: heart-beat 1s ease-in-out infinite;
      }

      .science-visual-label {
        color: #bfdbfe;
        font-size: 12px;
        margin-top: 8px;
      }

      .presenter-demo-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .presenter-demo-controls button {
        border: 0;
        border-radius: 10px;
        padding: 11px 14px;
        font-weight: 700;
        cursor: pointer;
      }

      .presenter-demo-play {
        background: #60a5fa;
        color: #0f172a;
      }

      .presenter-demo-stop {
        background: #334155;
        color: white;
      }

      .presenter-demo-status {
        font-size: 12px;
        color: #bfdbfe;
      }

      @keyframes presenter-breathe {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }

      @keyframes presenter-talk {
        from { height: 3px; }
        to { height: 12px; border-radius: 40%; }
      }

      @keyframes heart-beat {
        0%, 100% { transform: scale(1); }
        15% { transform: scale(1.13); }
        30% { transform: scale(1); }
        45% { transform: scale(1.08); }
      }

      @media (max-width: 420px) {
        .presenter-stage {
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          padding-inline: 2px;
        }

        .presenter-head {
          transform: translateX(-50%) scale(.85);
        }

        .presenter-coat {
          transform: translateX(-50%) scale(.85);
          transform-origin: bottom center;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .presenter-person,
        .science-heart,
        .presenter-mouth {
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getNarration(scene) {
    const field = scene.querySelector('[data-f="narration"]');
    return field ? field.value.trim() : "";
  }

  function getSceneTitle(scene) {
    const field = scene.querySelector('[data-f="title"]');
    return field ? field.value.trim() : "Science lesson";
  }

  function createPresenter(scene) {
    if (scene.querySelector(".science-presenter-demo")) return;

    const panel = document.createElement("section");
    panel.className = "science-presenter-demo";

    panel.innerHTML = `
      <h3>🎬 Animated Science Presenter</h3>
      <p>
        A browser-based teaching presenter with movement,
        narration preview and a scientific visual.
      </p>

      <div class="presenter-stage">
        <div class="presenter-person" aria-label="Animated science teacher">
          <div class="presenter-head">
            <div class="presenter-hair"></div>
            <div class="presenter-eyes">
              <span></span><span></span>
            </div>
            <div class="presenter-mouth"></div>
          </div>
          <div class="presenter-neck"></div>
          <div class="presenter-coat">
            <div class="presenter-shirt"></div>
          </div>
        </div>

        <div class="science-visual">
          <div class="science-heart">🫀</div>
          <div class="science-visual-label">
            SCIENCE VISUAL<br>
            Animated heart illustration
          </div>
        </div>
      </div>

      <div class="presenter-demo-controls">
        <button class="presenter-demo-play" type="button">
          ▶ Present this scene
        </button>
        <button class="presenter-demo-stop" type="button">
          ■ Stop
        </button>
      </div>

      <p class="presenter-demo-status" role="status" aria-live="polite">
        Ready to present.
      </p>
    `;

    const playButton = panel.querySelector(".presenter-demo-play");
    const stopButton = panel.querySelector(".presenter-demo-stop");
    const status = panel.querySelector(".presenter-demo-status");

    function stopPresentation() {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      panel.classList.remove("is-speaking");
      status.textContent = "Presentation stopped.";
    }

    playButton.addEventListener("click", function () {
      if (!("speechSynthesis" in window)) {
        status.textContent =
          "Speech playback is not supported by this browser.";
        return;
      }

      const narration = getNarration(scene);

      if (!narration) {
        status.textContent =
          "Add narration to this scene before presenting.";
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(narration);

      utterance.onstart = function () {
        panel.classList.add("is-speaking");
        status.textContent = "Presenter is speaking…";
      };

      utterance.onend = function () {
        panel.classList.remove("is-speaking");
        status.textContent = "Scene presentation finished.";
      };

      utterance.onerror = function () {
        panel.classList.remove("is-speaking");
        status.textContent = "Speech playback could not finish.";
      };

      window.speechSynthesis.speak(utterance);
    });

    stopButton.addEventListener("click", stopPresentation);

    const title = getSceneTitle(scene);
    panel.querySelector("h3").textContent =
      "🎬 " + (title || "Animated Science Presenter");

    const sceneGrid = scene.querySelector(".scenegrid");

    if (sceneGrid) {
      sceneGrid.insertAdjacentElement("afterend", panel);
    }
  }

  function scanScenes() {
    document.querySelectorAll("#scenes .scene").forEach(createPresenter);
  }

  function start() {
    addStyles();
    scanScenes();

    const observer = new MutationObserver(scanScenes);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
