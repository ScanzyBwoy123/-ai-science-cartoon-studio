/* 
 * AI Science Cartoon Studio
 * Presenter Clips Manager
 * Version: 1.0.0
 *
 * Features:
 * - Upload human presenter videos for individual scenes
 * - Store videos in IndexedDB instead of localStorage
 * - Retrieve and remove uploaded clips
 * - Keep presenter video audio muted so AI narration can play
 * - No paid video API or API key required
 */
(function () {
  "use strict";
  const DB_NAME = "ScienceStudioPresenterClips";
  const DB_VERSION = 1;
  const STORE_NAME = "clips";
  let databasePromise = null;
  function openDatabase() {
    if (databasePromise) {
      return databasePromise;
    }
    databasePromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("Your browser does not support IndexedDB."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "sceneId"
          });
          store.createIndex("updatedAt", "updatedAt", {
            unique: false
          });
        }
      };
      request.onsuccess = function (event) {
        resolve(event.target.result);
      };
      request.onerror = function () {
        databasePromise = null;
        reject(request.error || new Error("Could not open clip storage."));
      };
    });
    return databasePromise;
  }
  function validateVideo(file) {
    if (!file) {
      throw new Error("Please select a video file.");
    }
    if (!file.type || !file.type.startsWith("video/")) {
      throw new Error("Please select a valid video file.");
    }
    // Keep uploads reasonably sized for mobile browsers.
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error(
        "This video exceeds the 100 MB upload limit. Please choose a smaller clip."
      );
    }
    return true;
  }
  function saveClip(sceneId, file) {
    if (sceneId === undefined || sceneId === null || sceneId === "") {
      return Promise.reject(new Error("A scene ID is required."));
    }
    try {
      validateVideo(file);
    } catch (error) {
      return Promise.reject(error);
    }
    return openDatabase().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const record = {
          sceneId: String(sceneId),
          blob: file,
          fileName: file.name || "presenter-video",
          fileType: file.type || "video/mp4",
          fileSize: file.size,
          updatedAt: Date.now()
        };
        store.put(record);
        transaction.oncomplete = function () {
          resolve({
            sceneId: record.sceneId,
            fileName: record.fileName,
            fileSize: record.fileSize,
            updatedAt: record.updatedAt
          });
        };
        transaction.onerror = function () {
          reject(
            transaction.error ||
              new Error("Could not save the presenter video.")
          );
        };
        transaction.onabort = function () {
          reject(new Error("Saving the presenter video was cancelled."));
        };
      });
    });
  }
  function getClip(sceneId) {
    return openDatabase().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction
          .objectStore(STORE_NAME)
          .get(String(sceneId));
        request.onsuccess = function () {
          resolve(request.result || null);
        };
        request.onerror = function () {
          reject(request.error || new Error("Could not retrieve the video."));
        };
      });
    });
  }
  function removeClip(sceneId) {
    return openDatabase().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(String(sceneId));
        transaction.oncomplete = function () {
          resolve(true);
        };
        transaction.onerror = function () {
          reject(transaction.error || new Error("Could not remove the video."));
        };
      });
    });
  }
  function listClips() {
    return openDatabase().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).getAll();
        request.onsuccess = function () {
          const clips = (request.result || []).map((clip) => ({
            sceneId: clip.sceneId,
            fileName: clip.fileName,
            fileType: clip.fileType,
            fileSize: clip.fileSize,
            updatedAt: clip.updatedAt
          }));
          resolve(clips);
        };
        request.onerror = function () {
          reject(request.error || new Error("Could not list presenter videos."));
        };
      });
    });
  }
  function createVideoElement(clip) {
    if (!clip || !clip.blob) {
      throw new Error("No presenter video is available for this scene.");
    }
    const video = document.createElement("video");
    video.src = URL.createObjectURL(clip.blob);
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.controls = false;
    // The renderer can call play() when the scene begins.
    // The original video audio remains muted so narration stays clear.
    return video;
  }
  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) {
      return "Unknown size";
    }
    if (bytes < 1024 * 1024) {
      return Math.round(bytes / 1024) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
  window.ScienceStudioPresenterClips = Object.freeze({
    openDatabase,
    saveClip,
    getClip,
    removeClip,
    listClips,
    createVideoElement,
    formatFileSize
  });
})();
