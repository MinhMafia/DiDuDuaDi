import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import {
  buildPoiDetailUrl,
  getInitialPublicBaseUrl,
  isLocalBaseUrl,
  normalizePublicBaseUrl,
  persistPublicBaseUrl,
} from "../../utils/publicPoiUrl";
import "./PoiQrCard.css";

export default function PoiQrCard({ poiId, poiName, compact = false }) {
  const { t } = useTranslation();
  const [baseUrl, setBaseUrl] = useState(() => getInitialPublicBaseUrl());
  const [copied, setCopied] = useState(false);

  const detailUrl = useMemo(
    () => buildPoiDetailUrl(poiId, baseUrl),
    [baseUrl, poiId],
  );

  if (!poiId) {
    return null;
  }

  function handleBaseUrlChange(event) {
    const nextValue = event.target.value;
    setBaseUrl(nextValue);
    persistPublicBaseUrl(nextValue);
  }

  async function handleCopyLink() {
    if (!detailUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(detailUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = detailUrl;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const resolvedBaseUrl = normalizePublicBaseUrl(baseUrl);

  return (
    <section className={`poi-qr-card${compact ? " compact" : ""}`}>
      <div className="poi-qr-card-head">
        <div>
          <p className="poi-qr-kicker">{t("qr.kicker")}</p>
          <h3>{t("qr.title")}</h3>
          <p>{t("qr.subtitle", { name: poiName || t("qr.poiFallbackName") })}</p>
        </div>
      </div>

      <div className="poi-qr-body">
        <div className="poi-qr-code-wrap">
          {detailUrl ? (
            <QRCodeSVG
              value={detailUrl}
              size={compact ? 132 : 176}
              includeMargin
              bgColor="#ffffff"
              fgColor="#13263f"
            />
          ) : (
            <div className="poi-qr-empty">{t("qr.missingUrl")}</div>
          )}
        </div>

        <div className="poi-qr-content">
          <label className="poi-qr-field">
            <span>{t("qr.baseUrlLabel")}</span>
            <input
              type="text"
              value={baseUrl}
              onChange={handleBaseUrlChange}
              placeholder={t("qr.baseUrlPlaceholder")}
            />
          </label>

          {isLocalBaseUrl(resolvedBaseUrl) ? (
            <p className="poi-qr-hint">{t("qr.localHint")}</p>
          ) : (
            <p className="poi-qr-hint">{t("qr.readyHint")}</p>
          )}

          <label className="poi-qr-field">
            <span>{t("qr.detailLinkLabel")}</span>
            <textarea readOnly rows={compact ? 2 : 3} value={detailUrl} />
          </label>

          <div className="poi-qr-actions">
            <button type="button" className="poi-qr-button" onClick={handleCopyLink}>
              {copied ? t("qr.copied") : t("qr.copy")}
            </button>
            <a
              className="poi-qr-button secondary"
              href={detailUrl || "#"}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!detailUrl}
            >
              {t("qr.open")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
