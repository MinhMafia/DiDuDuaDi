export function getNetworkSnapshot() {
  if (typeof navigator === "undefined") {
    return {
      downlink: 0,
      effectiveType: "",
      online: true,
      rtt: 0,
      saveData: false,
    };
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return {
    downlink: Number(connection?.downlink || 0),
    effectiveType: String(connection?.effectiveType || ""),
    online: navigator.onLine !== false,
    rtt: Number(connection?.rtt || 0),
    saveData: Boolean(connection?.saveData),
  };
}

export function describeNetwork(snapshot, t) {
  if (!snapshot.online) {
    return {
      hint: t("audio.networkOfflineHint"),
      label: t("audio.networkOffline"),
      toneClass: "is-off",
    };
  }

  if (
    snapshot.saveData ||
    snapshot.effectiveType === "slow-2g" ||
    snapshot.effectiveType === "2g" ||
    (snapshot.downlink > 0 && snapshot.downlink < 1.3) ||
    snapshot.rtt >= 800
  ) {
    return {
      hint: formatNetworkHint(snapshot, t),
      label: t("audio.networkWeak"),
      toneClass: "is-warn",
    };
  }

  if (
    snapshot.effectiveType === "3g" ||
    (snapshot.downlink > 0 && snapshot.downlink < 5) ||
    (snapshot.rtt > 0 && snapshot.rtt >= 250)
  ) {
    return {
      hint: formatNetworkHint(snapshot, t),
      label: t("audio.networkMedium"),
      toneClass: "is-mid",
    };
  }

  return {
    hint: formatNetworkHint(snapshot, t),
    label: t("audio.networkStrong"),
    toneClass: "is-good",
  };
}

function formatNetworkHint(snapshot, t) {
  const parts = [];

  if (snapshot.effectiveType) {
    parts.push(snapshot.effectiveType.toUpperCase());
  }

  if (snapshot.downlink > 0) {
    parts.push(t("audio.downlinkHint", { speed: snapshot.downlink.toFixed(1) }));
  }

  if (snapshot.saveData) {
    parts.push(t("audio.dataSaverOn"));
  }

  return parts.join(" - ") || t("audio.networkFallbackHint");
}
