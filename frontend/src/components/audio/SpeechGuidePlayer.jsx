import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { useTranslation } from "react-i18next";
import { playCloudTts, stopAllCloudTts, translateText } from "../../services/translateService";

export default function SpeechGuidePlayer({
  audioUrl,
  onPlaybackStart,
  playbackKey,
  speechLanguage = "vi-VN",
  speechText,
  title,
  triggerAutoSpeak = false,
  variant = "full",
}) {
  const { t } = useTranslation();
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const lastAutoSpeakRef = useRef("");
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSpeechMode, setIsSpeechMode] = useState(false);
  const [voices, setVoices] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const speechSessionRef = useRef(0);
  const cloudTtsPlayerRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) {
      setDuration(0);
      setIsPlaying(false);
      setProgress(0);
      setIsSpeechMode(Boolean(speechText));
      return undefined;
    }

    setIsSpeechMode(false);

    const player = new Howl({
      src: [audioUrl],
      html5: true,
      onload: () => setDuration(player.duration()),
      onplay: () => {
        setIsPlaying(true);
        onPlaybackStart?.();
      },
      onpause: () => setIsPlaying(false),
      onstop: () => {
        setIsPlaying(false);
        setProgress(0);
      },
      onend: () => {
        setIsPlaying(false);
        setProgress(0);
      },
    });

    playerRef.current = player;

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      player.unload();
      playerRef.current = null;
    };
  }, [audioUrl, onPlaybackStart, speechText]);

  useEffect(() => {
    if (!isPlaying || !playerRef.current) return undefined;

    intervalRef.current = window.setInterval(() => {
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;
      setProgress(currentPlayer.seek() || 0);
    }, 300);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return undefined;

    const syncVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    syncVoices();
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices);

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", syncVoices);
    };
  }, []);

  useEffect(() => {
    stopSpeech();
    return () => stopSpeech();
  }, [playbackKey, speechLanguage]);

  useEffect(() => {
    if (!triggerAutoSpeak || !speechText) return;

    const autoSpeakToken = `${playbackKey}:${speechLanguage}`;
    if (lastAutoSpeakRef.current === autoSpeakToken) return;

    lastAutoSpeakRef.current = autoSpeakToken;

    if (audioUrl) {
      const currentPlayer = playerRef.current;
      if (currentPlayer && !currentPlayer.playing()) {
        currentPlayer.play();
      }
    } else if (speechText) {
      startSpeech();
    }
  }, [audioUrl, onPlaybackStart, playbackKey, speechLanguage, speechText, triggerAutoSpeak, voices]);

  function togglePlayback() {
    if (audioUrl) {
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;

      if (currentPlayer.playing()) {
        currentPlayer.pause();
      } else {
        currentPlayer.play();
      }
      return;
    }

    if (speechText) {
      if (isPlaying || isTranslating) {
        stopSpeech();
      } else {
        startSpeech();
      }
    }
  }

  function handleQuickToggle() {
    if (isPlaying || isTranslating) {
      handleStopPlayback();
      return;
    }

    togglePlayback();
  }

  function handleRewindFiveSeconds() {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    const currentProgress = Number(currentPlayer.seek() || 0);
    const nextProgress = Math.max(0, currentProgress - 5);
    currentPlayer.seek(nextProgress);
    setProgress(nextProgress);
  }

  function handleForwardFiveSeconds() {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    const currentProgress = Number(currentPlayer.seek() || 0);
    const nextProgress = Math.min(duration || currentProgress, currentProgress + 5);
    currentPlayer.seek(nextProgress);
    setProgress(nextProgress);
  }

  function handleStopPlayback() {
    if (audioUrl) {
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;
      currentPlayer.stop();
      setProgress(0);
      return;
    }

    stopSpeech();
  }

  function handleSeek(event) {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    const nextProgress = Number(event.target.value);
    currentPlayer.seek(nextProgress);
    setProgress(nextProgress);
  }

  async function startSpeech() {
    if (!speechText) return;

    const canUseSpeechSynthesis = "speechSynthesis" in window;

    if (canUseSpeechSynthesis) {
      window.speechSynthesis.cancel();
    }
    stopAllCloudTts();
    if (cloudTtsPlayerRef.current) {
      cloudTtsPlayerRef.current.cancel();
      cloudTtsPlayerRef.current = null;
    }

    const sessionId = ++speechSessionRef.current;
    const normalizedLanguage = speechLanguage.toLowerCase();
    const isVietnamese = normalizedLanguage.startsWith("vi");

    setIsTranslating(true);
    let finalSpeechText = speechText;
    if (!isVietnamese) {
      try {
        finalSpeechText = await translateText(speechText, speechLanguage);
      } catch (err) {
        console.error("Translation failed in SpeechGuidePlayer:", err);
      }
    }

    if (speechSessionRef.current !== sessionId) return;

    setIsTranslating(false);

    const getVoiceScore = (voice) => {
      let score = 0;
      const lang = voice.lang.toLowerCase();

      if (lang === normalizedLanguage) score += 100;
      else if (lang.startsWith(normalizedLanguage.slice(0, 2))) score += 50;
      else return -1;

      const name = voice.name.toLowerCase();
      if (name.includes("google") || name.includes("online") || name.includes("natural")) {
        score += 20;
      }
      if (voice.localService === false) {
        score += 10;
      }

      return score;
    };

    const matchingVoiceWithScore = [...voices]
      .map((voice) => ({ voice, score: getVoiceScore(voice) }))
      .filter((voiceMatch) => voiceMatch.score > 0)
      .sort((a, b) => b.score - a.score)[0];
    const shouldPreferCloudTts = isVietnamese || !matchingVoiceWithScore?.voice;

    const speakWithBrowserTts = () => {
      if (!canUseSpeechSynthesis) {
        return false;
      }

      if (isVietnamese && !matchingVoiceWithScore?.voice) {
        return false;
      }

      const utterance = new SpeechSynthesisUtterance(finalSpeechText);
      utterance.lang = speechLanguage;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => {
        setIsPlaying(true);
        onPlaybackStart?.();
      };
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      if (matchingVoiceWithScore?.voice) {
        utterance.voice = matchingVoiceWithScore.voice;
      }

      window.setTimeout(() => {
        if (speechSessionRef.current === sessionId) {
          window.speechSynthesis.speak(utterance);
        }
      }, 40);

      return true;
    };

    if (!canUseSpeechSynthesis && !isVietnamese) {
      cloudTtsPlayerRef.current = playCloudTts(finalSpeechText, speechLanguage, {
        onPlay: () => {
          setIsPlaying(true);
          onPlaybackStart?.();
        },
        onEnd: () => {
          cloudTtsPlayerRef.current = null;
          setIsPlaying(false);
        },
        onError: () => {
          cloudTtsPlayerRef.current = null;
          setIsPlaying(false);
        },
      });
      return;
    }

    if (shouldPreferCloudTts) {
      cloudTtsPlayerRef.current = playCloudTts(finalSpeechText, speechLanguage, {
        onPlay: () => {
          setIsPlaying(true);
          onPlaybackStart?.();
        },
        onEnd: () => {
          cloudTtsPlayerRef.current = null;
          setIsPlaying(false);
        },
        onError: () => {
          cloudTtsPlayerRef.current = null;
          if (!speakWithBrowserTts()) {
            setIsPlaying(false);
          }
        },
      });
      return;
    }

    if (!speakWithBrowserTts()) {
      cloudTtsPlayerRef.current = playCloudTts(finalSpeechText, speechLanguage, {
        onPlay: () => {
          setIsPlaying(true);
          onPlaybackStart?.();
        },
        onEnd: () => {
          cloudTtsPlayerRef.current = null;
          setIsPlaying(false);
        },
        onError: () => {
          cloudTtsPlayerRef.current = null;
          setIsPlaying(false);
        },
      });
    }
  }

  function stopSpeech() {
    speechSessionRef.current++;
    setIsTranslating(false);
    setIsPlaying(false);

    stopAllCloudTts();
    if (cloudTtsPlayerRef.current) {
      cloudTtsPlayerRef.current.cancel();
      cloudTtsPlayerRef.current = null;
    }
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  }

  const hasNarration = Boolean(audioUrl || speechText);
  const progressMax = duration || 1;
  const modeLabel = audioUrl
    ? t("audio.fileMode")
    : speechText
      ? t("audio.ttsMode")
      : t("audio.unavailable");
  const modeClassName = audioUrl ? "is-file" : speechText ? "is-tts" : "is-off";
  const compactButtonLabel = isTranslating
    ? t("audio.translating")
    : isPlaying
      ? t("audio.quickStop")
      : t("audio.quickPlay");
  const primaryButtonLabel = isTranslating
    ? t("audio.translating")
    : isPlaying
      ? (isSpeechMode ? t("audio.stop") : t("audio.pause"))
      : t("audio.play");

  if (variant === "compact") {
    return (
      <div className="audio-guide-compact" role="group" aria-label={t("audio.title")}>
        <button
          type="button"
          className={`audio-guide-compact-button${isPlaying ? " is-active" : ""}`}
          onClick={handleQuickToggle}
          disabled={!hasNarration || (isTranslating && !isPlaying)}
        >
          {compactButtonLabel}
        </button>
      </div>
    );
  }

  return (
    <section className="audio-guide-card">
      <div className="audio-guide-head">
        <div>
          <strong>{t("audio.title")}</strong>
          <p>{title || t("audio.noPoiSelected")}</p>
        </div>
        <span className={`audio-guide-mode-pill ${modeClassName}`}>{modeLabel}</span>
      </div>

      <div className="audio-guide-timeline">
        <div className="audio-guide-meta">
          <span className="audio-guide-time">{formatTime(progress)}</span>
          <span className="audio-guide-time">
            {audioUrl ? formatTime(duration) : t("audio.liveMode")}
          </span>
        </div>

        {audioUrl ? (
          <input
            type="range"
            min="0"
            max={progressMax}
            step="0.1"
            value={progress}
            onChange={handleSeek}
          />
        ) : (
          <input type="range" min="0" max="1" value="0" readOnly disabled />
        )}
      </div>

      <div className="audio-guide-controls">
        <button
          type="button"
          className="audio-guide-control secondary"
          onClick={handleRewindFiveSeconds}
          disabled={!audioUrl || isTranslating}
          title={!audioUrl ? t("audio.rewindRequiresAudioFile") : t("audio.rewind5")}
        >
          {t("audio.rewind5")}
        </button>
        <button
          type="button"
          className="audio-guide-control primary"
          onClick={togglePlayback}
          disabled={!hasNarration || (isTranslating && !isPlaying)}
        >
          {primaryButtonLabel}
        </button>
        <button
          type="button"
          className="audio-guide-control secondary"
          onClick={handleForwardFiveSeconds}
          disabled={!audioUrl || isTranslating}
          title={!audioUrl ? t("audio.forwardRequiresAudioFile") : t("audio.forward5")}
        >
          {t("audio.forward5")}
        </button>
        <button
          type="button"
          className="audio-guide-control secondary"
          onClick={handleStopPlayback}
          disabled={!hasNarration || isTranslating}
        >
          {t("audio.stop")}
        </button>
      </div>

      {audioUrl ? <p className="audio-guide-note">{t("audio.seekHint")}</p> : null}

      {!audioUrl && speechText ? (
        <p className="audio-guide-note">
          {isTranslating ? t("audio.translatingHint") : t("audio.seekUnavailable")}
        </p>
      ) : null}

      {!audioUrl && !speechText ? (
        <p className="audio-guide-note">{t("audio.unavailable")}</p>
      ) : null}
    </section>
  );
}

function formatTime(seconds) {
  if (!seconds) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainSeconds.toString().padStart(2, "0")}`;
}
