import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { useTranslation } from "react-i18next";

export default function AudioGuidePlayer({ audioUrl, title }) {
  const { t } = useTranslation();
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!audioUrl) {
      setDuration(0);
      setIsPlaying(false);
      setProgress(0);
      return undefined;
    }

    const player = new Howl({
      src: [audioUrl],
      html5: true,
      onload: () => {
        setDuration(player.duration());
      },
      onplay: () => {
        setIsPlaying(true);
      },
      onpause: () => {
        setIsPlaying(false);
      },
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
  }, [audioUrl]);

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

  function togglePlayback() {
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

  const progressMax = duration || 1;

  return (
    <section className="audio-guide-card">
      <div className="audio-guide-head">
        <div>
          <strong>{t("audio.title")}</strong>
          <p>{title || t("audio.noPoiSelected")}</p>
        </div>
        <button type="button" onClick={togglePlayback} disabled={!audioUrl}>
          {isPlaying ? t("audio.pause") : t("audio.play")}
        </button>
      </div>

      <input
        type="range"
        min="0"
        max={progressMax}
        step="0.1"
        value={progress}
        onChange={handleSeek}
        disabled={!audioUrl}
      />

      <div className="audio-guide-meta">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {!audioUrl ? <p className="supporting-text">{t("audio.unavailable")}</p> : null}
    </section>
  );
}

function formatTime(seconds) {
  if (!seconds) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainSeconds.toString().padStart(2, "0")}`;
}
