import { useCallback, useEffect, useRef, useState } from "react";

const PERMISSION_IDLE = "idle";
const PERMISSION_GRANTED = "granted";
const PERMISSION_DENIED = "denied";
const PERMISSION_UNSUPPORTED = "unsupported";
const HEADING_MIN_UPDATE_DELTA_DEGREES = 5;
const HEADING_UPDATE_INTERVAL_MS = 180;
const HEADING_SMOOTHING_ALPHA = 0.22;

function normalizeHeading(value) {
  if (!Number.isFinite(value)) return null;
  return ((value % 360) + 360) % 360;
}

function getShortestAngleDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

function smoothHeading(previous, next) {
  if (!Number.isFinite(previous)) return next;

  const delta = getShortestAngleDelta(previous, next);
  return normalizeHeading(previous + delta * HEADING_SMOOTHING_ALPHA);
}

function getHeadingFromEvent(event) {
  if (Number.isFinite(event.webkitCompassHeading)) {
    return normalizeHeading(event.webkitCompassHeading);
  }

  if (Number.isFinite(event.alpha)) {
    return normalizeHeading(360 - event.alpha);
  }

  return null;
}

function canUseDeviceOrientation() {
  return typeof window !== "undefined" && "DeviceOrientationEvent" in window;
}

export default function useDeviceHeading() {
  const [heading, setHeading] = useState(null);
  const [permissionState, setPermissionState] = useState(() =>
    canUseDeviceOrientation() ? PERMISSION_IDLE : PERMISSION_UNSUPPORTED,
  );
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const handlerRef = useRef(null);
  const smoothedHeadingRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const isSupported = canUseDeviceOrientation();

  const stopHeading = useCallback(() => {
    if (typeof window === "undefined" || !handlerRef.current) return;

    window.removeEventListener("deviceorientationabsolute", handlerRef.current, true);
    window.removeEventListener("deviceorientation", handlerRef.current, true);
    handlerRef.current = null;
    smoothedHeadingRef.current = null;
    lastUpdateTimeRef.current = 0;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || typeof window === "undefined") {
      setPermissionState(PERMISSION_UNSUPPORTED);
      setError("unsupported");
      return false;
    }

    if (handlerRef.current) {
      setIsListening(true);
      return true;
    }

    const handleOrientation = (event) => {
      const nextHeading = getHeadingFromEvent(event);
      if (!Number.isFinite(nextHeading)) return;

      const now = Date.now();
      const previousHeading = smoothedHeadingRef.current;
      const delta = Number.isFinite(previousHeading)
        ? Math.abs(getShortestAngleDelta(previousHeading, nextHeading))
        : Infinity;

      if (
        Number.isFinite(previousHeading) &&
        delta < HEADING_MIN_UPDATE_DELTA_DEGREES
      ) {
        return;
      }

      if (
        lastUpdateTimeRef.current &&
        now - lastUpdateTimeRef.current < HEADING_UPDATE_INTERVAL_MS
      ) {
        return;
      }

      const smoothedHeading = smoothHeading(previousHeading, nextHeading);
      smoothedHeadingRef.current = smoothedHeading;
      lastUpdateTimeRef.current = now;
      setHeading(smoothedHeading);
      setError("");
    };

    handlerRef.current = handleOrientation;
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    setIsListening(true);
    return true;
  }, [isSupported]);

  const requestHeading = useCallback(async () => {
    if (!isSupported || typeof window === "undefined") {
      setPermissionState(PERMISSION_UNSUPPORTED);
      setError("unsupported");
      return false;
    }

    setError("");

    const DeviceOrientation = window.DeviceOrientationEvent;
    if (typeof DeviceOrientation?.requestPermission === "function") {
      try {
        const result = await DeviceOrientation.requestPermission();
        if (result !== "granted") {
          stopHeading();
          setPermissionState(PERMISSION_DENIED);
          setError("denied");
          return false;
        }
      } catch {
        stopHeading();
        setPermissionState(PERMISSION_DENIED);
        setError("denied");
        return false;
      }
    }

    setPermissionState(PERMISSION_GRANTED);
    return startListening();
  }, [isSupported, startListening, stopHeading]);

  useEffect(() => stopHeading, [stopHeading]);

  return {
    error,
    heading,
    isListening,
    isSupported,
    permissionState,
    requestHeading,
    stopHeading,
  };
}
