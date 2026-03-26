import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { useTranslation } from "react-i18next";

export default function SpeechGuidePlayer({
  audioUrl,
  onPlaybackStart,
  playbackKey,
  speechLanguage = "vi-VN",
  speechText,
  title,
  triggerAutoSpeak = false,
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
    if (!triggerAutoSpeak || !speechText) return;

    const autoSpeakToken = `${playbackKey}:${speechLanguage}`;
    if (lastAutoSpeakRef.current === autoSpeakToken) return;

    lastAutoSpeakRef.current = autoSpeakToken;
    startSpeech();
  }, [onPlaybackStart, playbackKey, speechLanguage, speechText, triggerAutoSpeak, voices]);

  function togglePlayback() {
    if (!audioUrl && speechText) {
      if (isPlaying) {
        stopSpeech();
        return;
      }

      startSpeech();
      return;
    }

    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    if (currentPlayer.playing()) {
      currentPlayer.pause();
      return;
    }

    currentPlayer.play();
  }

  function handleSeek(event) {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    const nextProgress = Number(event.target.value);
    currentPlayer.seek(nextProgress);
    setProgress(nextProgress);
  }

  function startSpeech() {
    if (!speechText || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = speechLanguage;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setIsPlaying(true);
      onPlaybackStart?.();
    };
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    const normalizedLanguage = speechLanguage.toLowerCase();
    const sameLocaleVoice = voices.find(
      (voice) => voice.lang.toLowerCase() === normalizedLanguage,
    );
    const sameLanguageVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(normalizedLanguage.slice(0, 2)),
    );
    const matchingVoice = sameLocaleVoice || sameLanguageVoice;

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 40);
  }

  function stopSpeech() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }

  const progressMax = duration || 1;

  return (
    <section className="audio-guide-card">
      <div className="audio-guide-head">
        <div>
          <strong>{t("audio.title")}</strong>
          <p>{title || t("audio.noPoiSelected")}</p>
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          disabled={!audioUrl && !speechText}
        >
          {isPlaying ? (isSpeechMode ? t("audio.stop") : t("audio.pause")) : t("audio.play")}
        </button>
      </div>

      {audioUrl ? (
        <>
          <input
            type="range"
            min="0"
            max={progressMax}
            step="0.1"
            value={progress}
            onChange={handleSeek}
          />

          <div className="audio-guide-meta">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </>
      ) : null}

      {!audioUrl && speechText ? (
        <p className="supporting-text">{t("audio.ttsReady")}</p>
      ) : null}

      {!audioUrl && !speechText ? (
        <p className="supporting-text">{t("audio.unavailable")}</p>
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
