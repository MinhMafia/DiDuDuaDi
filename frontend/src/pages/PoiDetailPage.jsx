import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button, Spin, Empty, Tag, Descriptions } from "antd";
import { getPoiById } from "../services/analyticsService";
import "./PoiDetailPage.css";

export default function PoiDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();

  const { data: poi, isLoading, error } = useQuery({
    queryKey: ["poi-public", id],
    queryFn: () => getPoiById(id),
    select: (res) => res.data ?? null,
  });

  if (isLoading) {
    return (
      <div className="poi-detail-page">
        <div className="poi-detail-loading">
          <Spin size="large" />
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !poi) {
    return (
      <div className="poi-detail-page">
        <div className="poi-detail-error">
          <Empty
            description="Không tìm thấy thông tin địa điểm"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Link to="/map">
            <Button type="primary">Quay lại bản đồ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const name = poi.name?.vi || poi.name?.en || poi.shopName || "N/A";
  const description = poi.description?.vi || poi.description?.en || "Chưa có mô tả";
  const category = poi.category || "street_food";
  const address = poi.shopAddress || "Chưa cập nhật";
  const menuItems = poi.menuItems || [];

  return (
    <div className="poi-detail-page">
      <div className="poi-detail-container">
        <header className="poi-detail-header">
          <Link to="/map" className="poi-detail-back">
            ← {t("map.title") || "Bản đồ"}
          </Link>
          <div className="poi-detail-header-content">
            <h1>{name}</h1>
            <Tag color="blue">{category}</Tag>
          </div>
        </header>

        <div className="poi-detail-content">
          <section className="poi-detail-section">
            <h2>📍 Thông tin địa điểm</h2>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Địa chỉ">{address}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">
                {poi.lat && poi.lng
                  ? `${Number(poi.lat).toFixed(6)}, ${Number(poi.lng).toFixed(6)}`
                  : "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">{description}</Descriptions.Item>
            </Descriptions>
          </section>

          {menuItems.length > 0 && (
            <section className="poi-detail-section">
              <h2>🍜 Thực đơn ({menuItems.length} món)</h2>
              <div className="poi-detail-menu">
                {menuItems.map((item, index) => (
                  <div key={item.id || index} className="poi-menu-item">
                    <div className="poi-menu-item-info">
                      <h3>{item.name || "N/A"}</h3>
                      {item.description && <p>{item.description}</p>}
                    </div>
                    {item.price && (
                      <div className="poi-menu-item-price">
                        <strong>
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(item.price)}
                        </strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="poi-detail-section">
            <h2>📝 Ghi chú</h2>
            <div className="poi-detail-note">
              <p>
                Đây là thông tin công khai của địa điểm trên bản đồ DiDuDuaDi.
                Quét mã QR tại quán để xác nhận thanh toán và nhận ưu đãi.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
