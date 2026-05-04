import { useTranslation } from "react-i18next";
import SpeechGuidePlayer from "../audio/SpeechGuidePlayer";
export default function PoiDetailSheet({
  poi,
  autoNarrateOnTouch = false,
  distanceLabel,
  routeSummary,
  speechLanguage,
  onClose,
  onNarrateRequest,
  onPlaybackStart,
  playbackKey,
  speechText,
  titleSuffix = "",
  triggerAutoSpeak = false,
}) {
  const { t } = useTranslation();

  if (!poi) return null;

  return (
    <div className="poi-detail-sheet-backdrop" onClick={onClose} role="presentation">
      <section
        className="poi-detail-sheet"
        onClick={(event) => event.stopPropagation()}
        aria-label={t("map.detailTitle")}
      >
        <header className="poi-detail-header">
          <div>
            <p className="poi-detail-kicker">{t("map.detailTitle")}</p>
            <h2>{poi.displayName}</h2>
            <div className="poi-detail-meta">
              <span className="poi-category">{poi.category}</span>
              {distanceLabel ? <span>{distanceLabel}</span> : null}
            </div>
          </div>
          <button type="button" className="poi-detail-close" onClick={onClose}>
            {t("map.closeDetail")}
          </button>
        </header>

        <div className="poi-detail-content">
          {poi.imageUrl ? (
            <div className="poi-detail-hero">
              <img src={poi.imageUrl} alt={poi.displayName} />
            </div>
          ) : null}

          <section className="poi-detail-section">
            <h3>{t("map.aboutShopTitle")}</h3>
            {poi.shopName ? <p><strong>{poi.shopName}</strong></p> : null}
            {poi.shopAddress ? <p>{poi.shopAddress}</p> : null}
            {poi.openingHours ? (
              <p>
                <strong>{t("map.labels.openingHours")}:</strong> {poi.openingHours}
              </p>
            ) : null}
            {poi.phone ? (
              <p>
                <strong>{t("map.labels.phone")}:</strong> {poi.phone}
              </p>
            ) : null}
            {autoNarrateOnTouch ? (
              <button
                type="button"
                className="poi-description-trigger"
                onClick={onNarrateRequest}
              >
                {poi.displayDescription || t("map.noDescription")}
              </button>
            ) : (
              <p>{poi.displayDescription || t("map.noDescription")}</p>
            )}
            {poi.displayIntroduction ? (
              <p className="poi-detail-intro">{poi.displayIntroduction}</p>
            ) : null}
            {routeSummary ? <p className="poi-detail-route">{routeSummary}</p> : null}
          </section>

          <section className="poi-detail-section">
            <h3>{t("map.menuTitle")}</h3>
            {poi.menuItems?.length ? (
              <div className="poi-detail-menu-list">
                {poi.menuItems.map((item) => (
                  <article key={item.id} className="poi-detail-menu-item">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : null}
                    <div>
                      <div className="poi-detail-menu-head">
                        <strong>{item.name}</strong>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                      {item.description ? <p>{item.description}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="supporting-text">{t("map.emptyMenu")}</p>
            )}
          </section>

          <section className="poi-detail-section">
            <SpeechGuidePlayer
              audioUrl={poi.audioUrl}
              onPlaybackStart={onPlaybackStart}
              playbackKey={playbackKey || poi.id}
              speechLanguage={speechLanguage}
              speechText={speechText}
              title={`${poi.displayName}${titleSuffix ? ` (${titleSuffix})` : ""}`}
              triggerAutoSpeak={triggerAutoSpeak}
            />
          </section>
        </div>
      </section>
    </div>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
