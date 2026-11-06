/* Science Studio — Full-Body Animated Science Presenter
   Browser-based animation and narration.
   No paid API required. */
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
        border-radius: 20px;
        background: linear-gradient(135deg, #0b1225, #172554);
        color: #f8fafc;
        overflow: hidden;
        font-family: system-ui, sans-serif;
      }
      .science-presenter-demo h3 {
        color: #fff;
        margin: 0 0 8px;
        font-size: 19px;
      }
      .science-presenter-demo p {
        color: #cbd5e1;
        font-size: 13px;
        line-height: 1.6;
      }
      .presenter-stage {
        display: grid;
        grid-template-columns: minmax(150px, 1fr) minmax(110px, 1fr);
        gap: 8px;
        align-items: center;
        min-height: 310px;
        padding: 12px 5px;
        border-radius: 16px;
        background:
          radial-gradient(circle at 75% 30%, #1e40af 0, transparent 40%),
          linear-gradient(160deg, #172554, #020617);
        overflow: hidden;
      }
      .presenter-person {
        position: relative;
        width: 174px;
        max-width: 100%;
        height: 280px;
        margin: 0 auto;
        transform-origin: bottom center;
        animation: presenter-breathe 3s ease-in-out infinite;
      }
      /* HEAD */
      .presenter-head {
        position: absolute;
        z-index: 5;
        top: 8px;
        left: 50%;
        width: 64px;
        height: 72px;
        transform: translateX(-50%);
        border-radius: 44% 44% 48% 48%;
        background: linear-gradient(110deg, #9a6042, #e0a17a);
        box-shadow: inset -7px -2px 0 rgba(80, 35, 20, .12);
      }
      .presenter-hair {
        position: absolute;
        top: -5px;
        left: -2px;
        width: 68px;
        height: 28px;
        border-radius: 55% 55% 25% 20%;
        background: #172033;
      }
      .presenter-ear {
        position: absolute;
        top: 31px;
        width: 10px;
        height: 18px;
        border-radius: 50%;
        background: #b77a59;
      }
      .presenter-ear.left {
        left: -5px;
      }
      .presenter-ear.right {
        right: -5px;
      }
      .presenter-eyes {
        position: absolute;
        top: 31px;
        left: 13px;
        width: 39px;
        display: flex;
        justify-content: space-between;
      }
      .presenter-eyes span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #172033;
      }
      .presenter-nose {
        position: absolute;
        top: 37px;
        left: 29px;
        width: 7px;
        height: 10px;
        border-radius: 50%;
        border-right: 2px solid rgba(95, 50, 35, .65);
      }
      .presenter-mouth {
        position: absolute;
        top: 53px;
        left: 25px;
        width: 15px;
        height: 4px;
        border-radius: 50%;
        background: #713b35;
      }
      .science-presenter-demo.is-speaking .presenter-mouth {
        animation: presenter-talk .2s ease-in-out infinite alternate;
      }
      /* NECK AND BODY */
      .presenter-neck {
        position: absolute;
        z-index: 3;
        top: 70px;
        left: calc(50% - 10px);
        width: 20px;
        height: 22px;
        background: #b87d5a;
      }
      .presenter-shirt {
        position: absolute;
        z-index: 2;
        top: 87px;
        left: 50%;
        width: 34px;
        height: 92px;
        transform: translateX(-50%);
        background: linear-gradient(90deg, #1d4ed8, #60a5fa);
        clip-path: polygon(0 0, 100% 0, 72% 100%, 28% 100%);
      }
      .presenter-coat {
        position: absolute;
        z-index: 3;
        top: 85px;
        left: 50%;
        width: 92px;
        height: 103px;
        transform: translateX(-50%);
        border-radius: 18px 18px 5px 5px;
        background: linear-gradient(90deg, #bfdbfe, #fff 45%, #dbeafe);
        clip-path: polygon(13% 0, 35% 0, 50% 17%,
          65% 0, 87% 0, 100% 100%, 0 100%);
      }
      .presenter-lapel {
        position: absolute;
        top: 0;
        width: 22px;
        height: 65px;
        background: #e2e8f0;
      }
      .presenter-lapel.left {
        left: 16px;
        clip-path: polygon(0 0, 100% 15%, 70% 100%);
      }
      .presenter-lapel.right {
        right: 16px;
        clip-path: polygon(100% 0, 0 15%, 30% 100%);
      }
      .presenter-pocket {
        position: absolute;
        top: 43px;
        right: 13px;
        width: 17px;
        height: 22px;
        border: 2px solid #93c5fd;
        border-radius: 2px 2px 5px 5px;
      }
      /* ARMS, FOREARMS AND HANDS */
      .presenter-arm {
        position: absolute;
        z-index: 2;
        top: 91px;
        width: 24px;
        height: 61px;
        border-radius: 13px;
        background: linear-gradient(90deg, #bfdbfe, #fff);
        transform-origin: 50% 10px;
      }
      .presenter-arm.left {
        left: 26px;
        transform: rotate(13deg);
      }
      .presenter-arm.right {
        right: 26px;
        transform: rotate(-13deg);
      }
      .presenter-forearm {
        position: absolute;
        top: 45px;
        left: 1px;
        width: 22px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(90deg, #cbd5e1, #fff);
        transform-origin: 50% 8px;
      }
      .presenter-hand {
        position: absolute;
        bottom: -7px;
        left: 0;
        width: 23px;
        height: 21px;
        border-radius: 45% 45% 50% 50%;
        background: #c98d69;
      }
      .presenter-hand::before,
      .presenter-hand::after {
        content: "";
        position: absolute;
        top: 8px;
        width: 5px;
        height: 12px;
        border-radius: 5px;
        background: #c98d69;
      }
      .presenter-hand::before {
        left: 1px;
        transform: rotate(12deg);
      }
      .presenter-hand::after {
        right: 1px;
        transform: rotate(-12deg);
      }
      /* LEGS AND SHOES */
      .presenter-leg {
        position: absolute;
        z-index: 2;
        top: 180px;
        width: 25px;
        height: 61px;
        border-radius: 5px 5px 9px 9px;
        background: linear-gradient(90deg, #1e293b, #475569);
        transform-origin: 50% 8px;
      }
      .presenter-leg.left {
        left: 57px;
      }
      .presenter-leg.right {
        right: 57px;
      }
      .presenter-shoe {
        position: absolute;
        bottom: -5px;
        left: -7px;
        width: 37px;
        height: 15px;
        border-radius: 8px 12px 5px 5px;
        background: #0f172a;
        border-bottom: 3px solid #64748b;
      }
      .presenter-floor {
        position: absolute;
        bottom: 1px;
        left: 25px;
        width: 124px;
        height: 12px;
        border-radius: 50%;
        background: rgba(2, 6, 23, .55);
        filter: blur(3px);
      }
      /* TEACHING GESTURES */
      .science-presenter-demo.is-speaking .presenter-arm.left {
        animation: presenter-left-gesture 1.3s ease-in-out infinite;
      }
      .science-presenter-demo.is-speaking .presenter-arm.right {
        animation: presenter-point 1.7s ease-in-out infinite;
      }
      .science-presenter-demo.is-speaking .presenter-forearm {
        animation: presenter-forearm 1.1s ease-in-out infinite alternate;
      }
      .science-presenter-demo.is-speaking .presenter-hand {
        animation: presenter-hand-move .65s ease-in-out infinite alternate;
      }
      .science-presenter-demo.is-speaking .presenter-leg.left {
        animation: presenter-step 1.1s ease-in-out infinite alternate;
      }
      .science-presenter-demo.is-speaking .presenter-leg.right {
        animation: presenter-step 1.1s ease-in-out infinite alternate-reverse;
      }
      .science-visual {
        display: flex;
        min-width: 0;
        min-height: 180px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .science-heart {
        font-size: clamp(45px, 12vw, 70px);
        filter: drop-shadow(0 0 14px rgba(248, 113, 113, .45));
        animation: heart-beat 1s ease-in-out infinite;
      }
      .science-visual-label {
        color: #bfdbfe;
        font-size: 11px;
        margin-top: 8px;
        line-height: 1.5;
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
        50% { transform: translateY(-3px); }
      }
      @keyframes presenter-talk {
        from { height: 3px; }
        to { height: 11px; border-radius: 40%; }
      }
      @keyframes presenter-left-gesture {
        0%, 100% { transform: rotate(13deg); }
        50% { transform: rotate(-35deg); }
      }
      @keyframes presenter-point {
        0%, 100% { transform: rotate(-13deg); }
        50% { transform: rotate(-62deg); }
      }
      @keyframes presenter-forearm {
        from { transform: rotate(-10deg); }
        to { transform: rotate(24deg); }
      }
      @keyframes presenter-hand-move {
        from { transform: rotate(-10deg); }
        to { transform: rotate(12deg); }
      }
      @keyframes presenter-step {
        from { transform: rotate(-7deg); }
        to { transform: rotate(7deg); }
      }
      @keyframes heart-beat {
        0%, 100% { transform: scale(1); }
        15% { transform: scale(1.13); }
        30% { transform: scale(1); }
        45% { transform: scale(1.08); }
      }
      @media (max-width: 420px) {
        .science-presenter-demo {
          padding: 12px;
        }
        .presenter-stage {
          grid-template-columns: minmax(140px, 1fr) minmax(90px, .8fr);
          gap: 0;
          padding-inline: 0;
        }
        .presenter-person {
          transform: scale(.88);
          transform-origin: bottom center;
          margin-bottom: -20px;
        }
        .science-visual-label {
          font-size: 10px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .presenter-person,
        .presenter-arm,
        .presenter-forearm,
        .presenter-hand,
        .presenter-leg,
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
        Full-body science teacher with animated gestures,
        browser narration and a moving science visual.
      </p>
      <div class="presenter-stage">
        <div class="presenter-person"
             role="img"
             aria-label="Full-body animated science teacher">
          <div class="presenter-head">
            <div class="presenter-hair"></div>
            <div class="presenter-ear left"></div>
            <div class="presenter-ear right"></div>
            <div class="presenter-eyes">
              <span></span><span></span>
            </div>
            <div class="presenter-nose"></div>
            <div class="presenter-mouth"></div>
          </div>
          <div class="presenter-neck"></div>
          <div class="presenter-arm left">
            <div class="presenter-forearm">
              <div class="presenter-hand"></div>
            </div>
          </div>
          <div class="presenter-arm right">
            <div class="presenter-forearm">
              <div class="presenter-hand"></div>
            </div>
          </div>
          <div class="presenter-shirt"></div>
          <div class="presenter-coat">
            <div class="presenter-lapel left"></div>
            <div class="presenter-lapel right"></div>
            <div class="presenter-pocket"></div>
          </div>
          <div class="presenter-leg left">
            <div class="presenter-shoe"></div>
          </div>
          <div class="presenter-leg right">
            <div class="presenter-shoe"></div>
          </div>
          <div class="presenter-floor"></div>
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
      document.querySelectorAll(".science-presenter-demo")
        .forEach(function (otherPanel) {
          otherPanel.classList.remove("is-speaking");
        });
      const utterance = new SpeechSynthesisUtterance(narration);
      utterance.lang = "en";
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onstart = function () {
        panel.classList.add("is-speaking");
        status.textContent = "Presenter is speaking and gesturing…";
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
