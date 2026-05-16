import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button, Descriptions, Empty, Spin, Tag } from "antd";
import PoiQrCard from "../components/common/PoiQrCard";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { trackPoiView } from "../services/analyticsService";
import { getPoiById } from "../services/poiService";
import { translateText } from "../services/translateService";
import { getLocalizedValue } from "../utils/helpers";
import "./PoiDetailPage.css";

export default function PoiDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { i18n, t } = useTranslation();
  const [translatedPoiContent, setTranslatedPoiContent] = useState({});
  const trackedViewRef = useRef("");

  const {
    data: poi,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["poi-public", id],
    queryFn: () => getPoiById(id),
    enabled: Boolean(id),
    select: (response) => response.data ?? null,
  });

  useEffect(() => {
    if (!poi || !id) return;

    // Thống kê QR từ QR
    const params = new URLSearchParams(location.search);
    const source = params.get("source") === "qr" ? "qr" : "public-detail";
    const trackingKey = `${poi.id || id}:${i18n.language}:${source}`;

    if (trackedViewRef.current === trackingKey) {
      return;
    }

    trackedViewRef.current = trackingKey;

    trackPoiView({
      poiId: poi.id || id,
      languageCode: i18n.language,
      source,
    }).catch(() => {});
  }, [id, i18n.language, location.search, poi]);

  const speechLanguage =
    SUPPORTED_LANGUAGES.find((language) => language.code === i18n.language)
      ?.speechLocale || "vi-VN";

  useEffect(() => {
    let isCanceled = false;

    async function hydrateDetailTranslations() {
      if (!poi) {
        setTranslatedPoiContent({});
        return;
      }

      const nextTranslatedContent = {};

      if (shouldDynamicallyTranslate(poi.name, i18n.language)) {
        nextTranslatedContent.name = await safeTranslate(
          getTranslationSeed(poi.name, i18n.language),
          speechLanguage,
        );
      }

      if (shouldDynamicallyTranslate(poi.description, i18n.language)) {
        nextTranslatedContent.description = await safeTranslate(
          getTranslationSeed(poi.description, i18n.language),
          speechLanguage,
        );
      }

      if (shouldTranslatePlainText(poi.approvedIntroduction, i18n.language)) {
        nextTranslatedContent.approvedIntroduction = await safeTranslate(
          poi.approvedIntroduction,
          speechLanguage,
        );
      }

      if (Array.isArray(poi.menuItems) && i18n.language !== "vi") {
        nextTranslatedContent.menuItems = await Promise.all(
          poi.menuItems.map(async (item) => ({
            ...item,
            description: await translateDisplayField(
              item.description,
              i18n.language,
              speechLanguage,
            ),
            name: await translateDisplayField(
              item.name,
              i18n.language,
              speechLanguage,
            ),
          })),
        );
      }

      if (!isCanceled) {
        setTranslatedPoiContent(nextTranslatedContent);
      }
    }

    hydrateDetailTranslations();

    return () => {
      isCanceled = true;
    };
  }, [i18n.language, poi, speechLanguage]);

  if (isLoading) {
    return (
      <div className="poi-detail-page">
        <div className="poi-detail-loading">
          <Spin size="large" />
          <p>{t("poiDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !poi) {
    return (
      <div className="poi-detail-page">
        <div className="poi-detail-error">
          <Empty
            description={t("poiDetail.notFound")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button type="primary" onClick={() => navigate(-1)}>
            {t("poiDetail.goBack")}
          </Button>
        </div>
      </div>
    );
  }

  const name =
    translatedPoiContent.name ||
    getLocalizedValue(poi.name, i18n.language) ||
    poi.shopName ||
    t("poiDetail.unknownName");
  const description =
    translatedPoiContent.description ||
    getLocalizedValue(poi.description, i18n.language) ||
    t("map.noDescription");
  const category = getCategoryLabel(poi.category, t);
  const address = poi.shopAddress || t("poiDetail.notUpdated");
  const menuItems = translatedPoiContent.menuItems || poi.menuItems || [];
  const approvedIntroduction =
    translatedPoiContent.approvedIntroduction ||
    getLocalizedValue(poi.approvedIntroduction, i18n.language);
  const openingHours = poi.openingHours || t("poiDetail.notUpdated");
  const phone = poi.phone || t("poiDetail.notUpdated");
  const coordinates = poi.location
    ? `${Number(poi.location.lat).toFixed(6)}, ${Number(poi.location.lng).toFixed(6)}`
    : t("poiDetail.notUpdated");

  return (
    <div className="poi-detail-page">
      <div className="poi-detail-container">
        <header className="poi-detail-header">
          <button
            type="button"
            className="poi-detail-back"
            onClick={() => navigate(-1)}
          >
            {t("poiDetail.backToPrevious")}
          </button>

          <div className="poi-detail-hero-card">
            <div className="poi-detail-hero-copy">
              <div className="poi-detail-header-content">
                <div>
                  <p className="poi-detail-kicker">{t("map.detailTitle")}</p>
                  <h1>{name}</h1>
                </div>
                <Tag color="blue">{category}</Tag>
              </div>

              <p className="poi-detail-summary">{description}</p>

              <div className="poi-detail-link-row">
                <Link to="/login" className="poi-detail-inline-link">
                  {t("poiDetail.loginHint")}
                </Link>
              </div>
            </div>

            {poi.imageUrl ? (
              <div className="poi-detail-hero-media">
                <img src={poi.imageUrl} alt={name} />
              </div>
            ) : null}
          </div>
        </header>

        <div className="poi-detail-content">
          <section className="poi-detail-section">
            <h2>{t("poiDetail.shopInfoTitle")}</h2>
            <Descriptions bordered column={1}>
              <Descriptions.Item label={t("poiDetail.labels.address")}>
                {address}
              </Descriptions.Item>
              <Descriptions.Item label={t("poiDetail.labels.coordinates")}>
                {coordinates}
              </Descriptions.Item>
              <Descriptions.Item label={t("map.labels.openingHours")}>
                {openingHours}
              </Descriptions.Item>
              <Descriptions.Item label={t("map.labels.phone")}>
                {phone}
              </Descriptions.Item>
              <Descriptions.Item label={t("poiDetail.labels.description")}>
                {description}
              </Descriptions.Item>
              {approvedIntroduction ? (
                <Descriptions.Item label={t("poiDetail.labels.introduction")}>
                  {approvedIntroduction}
                </Descriptions.Item>
              ) : null}
            </Descriptions>
          </section>

          <PoiQrCard poiId={poi.id || id} poiName={name} />

          {menuItems.length > 0 ? (
            <section className="poi-detail-section">
              <h2>{t("poiDetail.menuTitle", { count: menuItems.length })}</h2>
              <div className="poi-detail-menu">
                {menuItems.map((item, index) => {
                  const itemName =
                    getLocalizedValue(item.name, i18n.language) ||
                    t("poiDetail.unknownDish");
                  const itemDescription = getLocalizedValue(
                    item.description,
                    i18n.language,
                  );

                  return (
                    <div key={item.id || index} className="poi-menu-item">
                      <div className="poi-menu-item-main">
                        {item.imageUrl ? (
                          <div className="poi-menu-item-media">
                            <img src={item.imageUrl} alt={itemName || name} />
                          </div>
                        ) : null}

                        <div className="poi-menu-item-info">
                          <h3>{itemName}</h3>
                          {itemDescription ? <p>{itemDescription}</p> : null}
                        </div>
                      </div>

                      {item.price ? (
                        <div className="poi-menu-item-price">
                          <strong>
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                              maximumFractionDigits: 0,
                            }).format(item.price)}
                          </strong>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="poi-detail-section">
            <h2>{t("poiDetail.noteTitle")}</h2>
            <div className="poi-detail-note">
              <p>{t("poiDetail.noteBody")}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function hasDirectLocalizedValue(value, language) {
  if (!value || typeof value !== "object") return false;
  return Boolean(value[language]);
}

function shouldDynamicallyTranslate(value, language) {
  if (!value || language === "vi") return false;
  return !hasDirectLocalizedValue(value, language);
}

function shouldTranslatePlainText(value, language) {
  if (!value || typeof value !== "string") return false;
  return language !== "vi";
}

function getTranslationSeed(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;

  if (language === "en") {
    return (
      value.en ||
      value.vi ||
      Object.values(value).find((item) => typeof item === "string") ||
      ""
    );
  }

  if (language !== "vi") {
    return (
      value[language] ||
      value.en ||
      value.vi ||
      Object.values(value).find((item) => typeof item === "string") ||
      ""
    );
  }

  return (
    value[language] ||
    value.vi ||
    value.en ||
    Object.values(value).find((item) => typeof item === "string") ||
    ""
  );
}

function getCategoryLabel(category, t) {
  const normalizedCategory = category || "food";
  return t(`map.categoryLabels.${normalizedCategory}`, {
    defaultValue: normalizedCategory.replace(/_/g, " "),
  });
}

async function safeTranslate(text, targetLanguage) {
  if (!text) return "";

  try {
    return await translateText(text, targetLanguage);
  } catch {
    return text;
  }
}

async function translateDisplayField(value, language, speechLanguage) {
  if (
    shouldTranslatePlainText(value, language) ||
    shouldDynamicallyTranslate(value, language)
  ) {
    return safeTranslate(getTranslationSeed(value, language), speechLanguage);
  }

  return getLocalizedValue(value, language);
}
