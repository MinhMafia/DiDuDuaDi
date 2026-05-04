import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button, Descriptions, Empty, Spin, Tag } from "antd";
import PoiQrCard from "../components/common/PoiQrCard";
import { getPoiById } from "../services/poiService";
import { getLocalizedValue } from "../utils/helpers";
import "./PoiDetailPage.css";

export default function PoiDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { i18n, t } = useTranslation();

  const { data: poi, isLoading, error } = useQuery({
    queryKey: ["poi-public", id],
    queryFn: () => getPoiById(id),
    enabled: Boolean(id),
    select: (response) => response.data ?? null,
  });

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
    getLocalizedValue(poi.name, i18n.language) || poi.shopName || t("poiDetail.unknownName");
  const description =
    getLocalizedValue(poi.description, i18n.language) || t("map.noDescription");
  const category = poi.category || "street_food";
  const address = poi.shopAddress || t("poiDetail.notUpdated");
  const menuItems = poi.menuItems || [];
  const openingHours = poi.openingHours || t("poiDetail.notUpdated");
  const phone = poi.phone || t("poiDetail.notUpdated");
  const coordinates = poi.location
    ? `${Number(poi.location.lat).toFixed(6)}, ${Number(poi.location.lng).toFixed(6)}`
    : t("poiDetail.notUpdated");

  return (
    <div className="poi-detail-page">
      <div className="poi-detail-container">
        <header className="poi-detail-header">
          <button type="button" className="poi-detail-back" onClick={() => navigate(-1)}>
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
              {poi.approvedIntroduction ? (
                <Descriptions.Item label={t("poiDetail.labels.introduction")}>
                  {poi.approvedIntroduction}
                </Descriptions.Item>
              ) : null}
            </Descriptions>
          </section>

          <PoiQrCard poiId={poi.id || id} poiName={name} />

          {menuItems.length > 0 ? (
            <section className="poi-detail-section">
              <h2>{t("poiDetail.menuTitle", { count: menuItems.length })}</h2>
              <div className="poi-detail-menu">
                {menuItems.map((item, index) => (
                  <div key={item.id || index} className="poi-menu-item">
                    <div className="poi-menu-item-main">
                      {item.imageUrl ? (
                        <div className="poi-menu-item-media">
                          <img src={item.imageUrl} alt={item.name || name} />
                        </div>
                      ) : null}

                      <div className="poi-menu-item-info">
                        <h3>{item.name || t("poiDetail.unknownDish")}</h3>
                        {item.description ? <p>{item.description}</p> : null}
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
                ))}
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
