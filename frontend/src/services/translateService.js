/**
 * A lightweight translate service using Google Translate's free `gtx` endpoint.
 * Suitable for basic dynamic translations like POI descriptions.
 */

const CACHE_KEY_PREFIX = "didududadi_trans_";
let activeCloudTtsCancel = null;

export function stopAllCloudTts() {
  if (typeof activeCloudTtsCancel === "function") {
    activeCloudTtsCancel();
    activeCloudTtsCancel = null;
  }
}

/**
 * Translates text automatically to the target language.
 *
 * @param {string} text - The text to be translated.
 * @param {string} targetLang - The target language code (e.g., 'vi-VN', 'en-US').
 * @returns {Promise<string>} The translated text.
 */
export async function translateText(text, targetLang) {
  if (!text) return "";

  // Extract base language code for Google Translate (e.g. 'en-US' -> 'en', 'vi-VN' -> 'vi')
  const langCode = targetLang.split("-")[0];

  const cacheKey = `${CACHE_KEY_PREFIX}${langCode}_${hashCode(text)}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Translation failed");
    }
    const data = await response.json();

    // Google Translate returns array of arrays, we need to join the translated chunks
    let translatedText = "";
    if (data && data[0]) {
      for (const chunk of data[0]) {
        if (chunk[0]) {
          translatedText += chunk[0];
        }
      }
    }

    if (translatedText) {
      saveToCache(cacheKey, translatedText);
      return translatedText;
    }

    return text; // Fallback to original if parsing fails
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to original
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

function getFromCache(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return item;
  } catch (e) {
    return null;
  }
}

function saveToCache(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Ignore localStorage write errors (private mode, quota exceeded, etc.)
  }
}

/**
 * A fallback TTS player that streams high-quality MP3 from Google Translate
 * Useful when local OS doesn't have proper voices (like Vietnamese on base Windows)
 */
export function playCloudTts(text, langCode, callbacks) {
    const { onPlay, onEnd, onError } = callbacks;

    stopAllCloudTts();

    // Split into chunks of ~150 chars max to respect API limits, preserving words
    const words = text.split(" ");
    const chunks = [];
    let currentChunk = "";
    for (const word of words) {
      if (currentChunk.length + word.length > 150) {
        chunks.push(currentChunk);
        currentChunk = word;
      } else {
        currentChunk += (currentChunk ? " " : "") + word;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    let currentIndex = 0;
    let currentAudio = null;
    let isCancelled = false;
    const spawnedAudios = [];

    const cleanupCurrentAudio = () => {
      if (!currentAudio) return;
      currentAudio.onplay = null;
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.removeAttribute("src");
      currentAudio.src = "";
      currentAudio.load();
      currentAudio = null;
    };

    const cleanupAudio = (audio) => {
      if (!audio) return;
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.src = "";
      audio.load();
    };

    const cancel = () => {
      isCancelled = true;
      cleanupCurrentAudio();
      for (const audio of spawnedAudios) {
        cleanupAudio(audio);
      }
      spawnedAudios.length = 0;
      if (activeCloudTtsCancel === cancel) {
        activeCloudTtsCancel = null;
      }
    };

    activeCloudTtsCancel = cancel;

    const playNext = () => {
      if (isCancelled) return;
      if (currentIndex >= chunks.length) {
        if (activeCloudTtsCancel === cancel) {
          activeCloudTtsCancel = null;
        }
        if (onEnd) onEnd();
        return;
      }

      const chunk = chunks[currentIndex].trim();
      if (!chunk) {
        currentIndex++;
        playNext();
        return;
      }

      const shortLang = langCode.split("-")[0];
      const url = `/api/tts/google?lang=${encodeURIComponent(shortLang)}&text=${encodeURIComponent(chunk)}`;

      currentAudio = new Audio(url);
      spawnedAudios.push(currentAudio);
      currentAudio.onplay = () => { if (currentIndex === 0 && onPlay) onPlay(); };
      currentAudio.onended = () => {
        currentIndex++;
        playNext();
      };
      currentAudio.onerror = (e) => {
        console.error("Cloud TTS Error");
        if (activeCloudTtsCancel === cancel) {
          activeCloudTtsCancel = null;
        }
        if (onError) onError(e);
      };

      currentAudio.play().catch(e => {
        console.error("Cloud TTS Play Error", e);
        if (activeCloudTtsCancel === cancel) {
          activeCloudTtsCancel = null;
        }
        if (onError) onError(e);
      });
    };

    playNext();

    return {
      cancel
    };
  }
