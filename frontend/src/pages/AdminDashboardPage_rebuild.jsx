import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  Button,
  Input,
  Typography,
  Space,
  Tag,
  Spin,
  Row,
  Col,
  Empty,
  Table,
  Modal,
  Form,
  message,
} from "antd";
import Loading from "../components/common/Loading";
import {
  getOwnerUpgradeRequests,
  getShopIntroReviews,
  reviewOwnerUpgradeRequest,
  reviewShopIntro,
  confirmOwnerUpgradePayment,
  cancelOwnerUpgradePayment,
  getFoodTours,
  createFoodTour,
  deleteFoodTour,
  updateFoodTour,
} from "../services/adminService";
import {
  getTopShops,
  getTopPois,
  getPois,
  createPoi,
  updatePoi,
  deletePoi,
} from "../services/analyticsService";
import "./AdminDashboardPage.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);

  const [activeSection, setActiveSection] = useState("overview");
  const [feedback, setFeedback] = useState("");

  // Review notes
  const [ownerReviewNotes, setOwnerReviewNotes] = useState({});
  const [introReviewNotes, setIntroReviewNotes] = useState({});

  // Stats states
  const [statsPeriod, setStatsPeriod] = useState("30");
  const [statsMetric, setStatsMetric] = useState("visits");

  // POI manage
  const [poiModalVisible, setPoiModalVisible] = useState(false);
  const [editingPoi, setEditingPoi] = useState(null);
  const [poiSearch, setPoiSearch] = useState("");

  // Food Tour states
  const [editingTour, setEditingTour] = useState(null);
  const [editTourModalVisible, setEditTourModalVisible] = useState(false);
  const [tourModalVisible, setTourModalVisible] = useState(false);
  const [selectedPois, setSelectedPois] = useState([]);

  // ================= SECTIONS =================
  const sections = [
    {
      id: "overview",
      label: t("admin.sections.overview") || "Tổng quan",
      kicker: t("admin.sections.overviewKicker") || "Bảng điều khiển",
      description: t("admin.sections.overviewDescription") || "Thống kê nhanh và các tác vụ gần đây",
      badge: "📊",
    },
    {
      id: "ownerRequests",
      label: t("admin.sections.ownerRequests") || "Duyệt chủ quán",
      kicker: t("admin.sections.ownerRequestsKicker") || "Yêu cầu nâng quyền",
      description: t("admin.sections.ownerRequestsDescription") || "Phê duyệt hoặc từ chối yêu cầu trở thành chủ quán",
      badge: "👤",
    },
    {
      id: "shopIntros",
      label: t("admin.sections.shopIntros") || "Duyệt nội dung",
      kicker: t("admin.sections.shopIntrosKicker") || "Giới thiệu quán",
      description: t("admin.sections.shopIntrosDescription") || "Kiểm duyệt nội dung giới thiệu quán",
      badge: "📝",
    },
    {
      id: "statistics",
      label: t("admin.sections.statistics") || "Thống kê",
      kicker: t("admin.sections.statisticsKicker") || "Top quán & POI",
      description: t("admin.sections.statisticsDescription") || "Xem thống kê tương tác theo khoảng thời gian",
      badge: "📈",
    },
    {
      id: "managePois",
      label: t("admin.sections.managePois") || "Quản lý POI",
      kicker: t("admin.sections.managePoisKicker") || "Địa điểm",
      description: t("admin.sections.managePoisDescription") || "Thêm, sửa, xóa các điểm trên bản đồ",
      badge: "📍",
    },
    {
      id: "foodTours",
      label: t("admin.sections.foodTours") || "Quản lý Tour",
      kicker: t("admin.sections.foodToursKicker") || "Lộ trình",
      description: t("admin.sections.foodToursDescription") || "Tạo và quản lý các tour du lịch ẩm thực",
      badge: "🚶",
    },
  ];

  const activeSectionMeta =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  // ================= QUERIES =================
  const pendingOwnerRequestsQuery = useQuery({
    queryKey: ["owner-upgrade-requests", "pending"],
    queryFn: async () => {
      const [pending, paymentPending] = await Promise.all([
        getOwnerUpgradeRequests("pending"),
        getOwnerUpgradeRequests("payment_pending"),
      ]);
      return [...(pending.data ?? []), ...(paymentPending.data ?? [])];
    },
  });

  const reviewedOwnerRequestsQuery = useQuery({
    queryKey: ["owner-upgrade-requests", "reviewed"],
    queryFn: async () => {
      const [approved, rejected] = await Promise.all([
        getOwnerUpgradeRequests("approved"),
        getOwnerUpgradeRequests("rejected"),
      ]);
      return [...(approved.data ?? []), ...(rejected.data ?? [])];
    },
  });

  const pendingIntroReviewsQuery = useQuery({
    queryKey: ["shop-intro-reviews", "pending"],
    queryFn: () => getShopIntroReviews("pending"),
    select: (res) => res.data ?? [],
  });

  const reviewedIntroReviewsQuery = useQuery({
    queryKey: ["shop-intro-reviews", "reviewed"],
    queryFn: async () => {
      const [approved, rejected] = await Promise.all([
        getShopIntroReviews("approved"),
        getShopIntroReviews("rejected"),
      ]);
      return [...(approved.data ?? []), ...(rejected.data ?? [])];
    },
  });

  const topShopsQuery = useQuery({
    queryKey: ["topShops", statsPeriod, statsMetric],
    queryFn: () => getTopShops(parseInt(statsPeriod), 10, statsMetric),
    enabled: !!(statsPeriod && statsMetric),
    select: (res) => {
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.data?.items)) return res.data.items;
      return [];
    },
  });

  const topPoisQuery = useQuery({
    queryKey: ["topPois", statsPeriod, statsMetric],
    queryFn: () => getTopPois(parseInt(statsPeriod), 10, statsMetric),
    enabled: !!(statsPeriod && statsMetric),
    select: (res) => {
      return Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.items)
        ? res.data.items
        : [];
    },
  });

  const poisQuery = useQuery({
    queryKey: ["pois"],
    queryFn: () => getPois(),
    select: (res) => {
      const data = res.data ?? [];
      return data.map((p) => ({
        ...p,
        lat: p.location?.lat,
        lng: p.location?.lng,
        displayName:
          p.name?.vi || p.name?.en || Object.values(p.name || {})[0],
      }));
    },
  });

  const foodToursQuery = useQuery({
    queryKey: ["foodTours"],
    queryFn: getFoodTours,
    select: (res) => {
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      return [];
    },
  });

  // ================= MUTATIONS =================
  const ownerReviewMutation = useMutation({
    mutationFn: ({ requestId, action, reason }) =>
      reviewOwnerUpgradeRequest(requestId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests"] });
      message.success("Đã xử lý yêu cầu nâng quyền");
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (requestId) => confirmOwnerUpgradePayment(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests"] });
      message.success("Đã kích hoạt quyền chủ quán");
    },
  });

  const cancelPaymentMutation = useMutation({
    mutationFn: (requestId) => cancelOwnerUpgradePayment(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests"] });
      message.success("Đã hủy mã QR");
    },
  });

  const introReviewMutation = useMutation({
    mutationFn: ({ shopId, action, reason }) =>
      reviewShopIntro(shopId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-intro-reviews"] });
      message.success("Đã xử lý duyệt nội dung");
    },
  });

  const poiCreateMutation = useMutation({
    mutationFn: createPoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
      message.success("Tạo POI thành công");
    },
  });

  const poiUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePoi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
      message.success("Cập nhật POI thành công");
    },
  });

  const poiDeleteMutation = useMutation({
    mutationFn: deletePoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
      message.success("Xóa POI thành công");
    },
  });

  const tourCreateMutation = useMutation({
    mutationFn: createFoodTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodTours"] });
      message.success("Tạo tour thành công");
      setTourModalVisible(false);
      setSelectedPois([]);
    },
  });

  const foodTourUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => updateFoodTour(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodTours"] });
      message.success("Cập nhật tour thành công");
      setEditTourModalVisible(false);
      setSelectedPois([]);
      setEditingTour(null);
    },
  });

  const foodTourDeleteMutation = useMutation({
    mutationFn: deleteFoodTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodTours"] });
      message.success("Xóa tour thành công");
    },
  });

  // ================= COLUMNS =================
  const tourColumns = [
    {
      title: "Tên lộ trình",
      render: (_, record) =>
        record.title?.vi || record.title?.en || "Chưa có tên",
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      render: (cat) => <Tag color="orange">{cat}</Tag>,
    },
    {
      title: "Số điểm dừng",
      render: (_, record) => (
        <Tag color="blue">{record.steps?.length || 0} địa điểm</Tag>
      ),
    },
    {
      title: "Mô tả",
      render: (_, record) =>
        record.description?.vi || record.description?.en || "Không có mô tả",
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditingTour(record);
              setEditTourModalVisible(true);
              setSelectedPois(record.steps?.map((s) => s.poiId) || []);
            }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: "Xóa food tour?",
                content: record.title?.vi || "Không tên",
                okText: "Xóa",
                okType: "danger",
                cancelText: "Hủy",
                onOk: () => foodTourDeleteMutation.mutate(record.id),
              });
            }}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const shopsColumns = [
    {
      title: "Quán",
      dataIndex: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Slug",
      dataIndex: "slug",
    },
    {
      title: "Vị trí",
      render: (_, record) => {
        const lat = Number(record?.lat);
        const lng = Number(record?.lng);
        if (isNaN(lat) || isNaN(lng)) return "N/A";
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      },
    },
    {
      title: "Lượt",
      dataIndex: "count",
      sorter: (a, b) => a.count - b.count,
    },
  ];

  const topPoisColumns = [
    {
      title: "Tên địa điểm",
      render: (_, record) => (
        <strong>{record.name || record.Name || record.shopName || "N/A"}</strong>
      ),
    },
    {
      title: "ID",
      render: (_, record) => (
        <Tag>{(record.id || record.Id || "").slice(-8)}</Tag>
      ),
    },
    {
      title: "Vị trí",
      render: (_, record) => {
        const lat = record.lat ?? record.location?.lat;
        const lng = record.lng ?? record.location?.lng;
        return lat ? `${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}` : "N/A";
      },
    },
    {
      title: "Lượt tương tác",
      dataIndex: "count",
      sorter: (a, b) => a.count - b.count,
      render: (count) => (
        <Tag color="orange" style={{ fontWeight: "bold" }}>
          {count} lượt
        </Tag>
      ),
    },
  ];

  const managePoisColumns = [
    {
      title: "Tên",
      render: (_, record) => {
        const nameObj = record.name || {};
        return <strong>{nameObj.vi || nameObj.en || record.shopName || "N/A"}</strong>;
      },
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      render: (cat) => <Tag color="blue">{cat || "street_food"}</Tag>,
    },
    {
      title: "Địa chỉ",
      dataIndex: "shopAddress",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Thông số",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <small>
            📍 {record.lat}, {record.lng}
          </small>
          <small>🎯 Bán kính: {record.radius}m</small>
        </Space>
      ),
    },
    {
      title: "Menu",
      dataIndex: "menuItems",
      render: (menu) => (
        <Tag color={menu?.length > 0 ? "green" : "default"}>
          {menu?.length || 0} món
        </Tag>
      ),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEditingPoi(record);
              setPoiModalVisible(true);
            }}
          >
            Sửa
          </Button>
          <Button
            danger
            onClick={() => poiDeleteMutation.mutate(record.id || record.Id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // ================= HANDLERS =================
  function handleOwnerReview(requestId, action) {
    ownerReviewMutation.mutate({
      requestId,
      action,
      reason: ownerReviewNotes[requestId],
    });
  }

  function handleIntroReview(shopId, action) {
    introReviewMutation.mutate({
      shopId,
      action,
      reason: introReviewNotes[shopId],
    });
  }

  // ================= RENDER SECTIONS =================
  function renderOverviewPanel() {
    const pendingOwnerCount = pendingOwnerRequestsQuery.data?.length || 0;
    const pendingIntroCount = pendingIntroReviewsQuery.data?.length || 0;
    const totalPois = poisQuery.data?.length || 0;
    const totalTours = foodToursQuery.data?.length || 0;

    return (
      <div className="admin-stage">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="admin-section-kicker">Tổng quan nhanh</p>
              <h2>Thống kê tổng quan</h2>
            </div>
          </div>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <strong>{pendingOwnerCount}</strong>
              <span>Yêu cầu chủ quán chờ duyệt</span>
            </div>
            <div className="admin-stat-card">
              <strong>{pendingIntroCount}</strong>
              <span>Nội dung giới thiệu chờ duyệt</span>
            </div>
            <div className="admin-stat-card">
              <strong>{totalPois}</strong>
              <span>POI trên bản đồ</span>
            </div>
            <div className="admin-stat-card">
              <strong>{totalTours}</strong>
              <span>Tour ẩm thực đang hoạt động</span>
            </div>
          </div>
        </article>
      </div>
    );
  }

  function renderOwnerRequestsPanel() {
    return (
      <div className="admin-stage">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="admin-section-kicker">Yêu cầu nâng quyền</p>
              <h2>Duyệt yêu cầu chủ quán</h2>
              <p>Kiểm tra hồ sơ và phê duyệt yêu cầu trở thành chủ quán</p>
            </div>
          </div>

          {pendingOwnerRequestsQuery.isLoading ? (
            <Loading />
          ) : pendingOwnerRequestsQuery.data.length === 0 ? (
            <Empty description="Không có yêu cầu nào đang chờ duyệt." />
          ) : (
            <div className="admin-request-list">
              {pendingOwnerRequestsQuery.data.map((request) => (
                <article key={request.id} className="admin-request-card">
                  <div className="admin-request-header">
                    <div>
                      <h3>{request.shopName}</h3>
                      <p className="admin-request-meta">
                        👤 {request.username} - {request.displayName}
                      </p>
                    </div>
                    <Tag color={request.status === "payment_pending" ? "orange" : "blue"}>
                      {request.status}
                    </Tag>
                  </div>

                  <div className="admin-request-body">
                    <p>📍 {request.addressLine}</p>
                    {(request.latitude !== null && request.latitude !== undefined) ||
                    (request.longitude !== null && request.longitude !== undefined) ? (
                      <p>
                        🧭 {formatCoordinate(request.latitude)},{" "}
                        {formatCoordinate(request.longitude)}
                      </p>
                    ) : null}
                    {request.note && <p>📝 {request.note}</p>}

                    {request.status === "payment_pending" ? (
                      <div className="admin-payment-section">
                        {request.paymentReferenceCode && (
                          <p>QR: {request.paymentReferenceCode}</p>
                        )}
                        {request.paymentQrImageUrl && (
                          <img
                            src={request.paymentQrImageUrl}
                            alt="Payment QR"
                            className="admin-payment-qr"
                          />
                        )}
                        <div className="admin-payment-actions">
                          <Button
                            type="primary"
                            loading={confirmPaymentMutation.isPending}
                            onClick={() => confirmPaymentMutation.mutate(request.id)}
                          >
                            Kích hoạt owner
                          </Button>
                          <Button
                            danger
                            loading={cancelPaymentMutation.isPending}
                            onClick={() => cancelPaymentMutation.mutate(request.id)}
                          >
                            Hủy QR
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-review-section">
                        <TextArea
                          placeholder="Nhập ghi chú duyệt hoặc lý do từ chối"
                          autoSize={{ minRows: 2 }}
                          value={ownerReviewNotes[request.id] || ""}
                          onChange={(e) =>
                            setOwnerReviewNotes((prev) => ({
                              ...prev,
                              [request.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="admin-review-actions">
                          <Button
                            type="primary"
                            loading={ownerReviewMutation.isPending}
                            onClick={() => handleOwnerReview(request.id, "approve")}
                          >
                            Tạo QR thanh toán
                          </Button>
                          <Button
                            danger
                            loading={ownerReviewMutation.isPending}
                            onClick={() => handleOwnerReview(request.id, "reject")}
                          >
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>
    );
  }

  function renderShopIntrosPanel() {
    return (
      <div className="admin-stage">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="admin-section-kicker">Nội dung chờ duyệt</p>
              <h2>Duyệt giới thiệu quán</h2>
              <p>Kiểm duyệt nội dung giới thiệu do chủ quán gửi lên</p>
            </div>
          </div>

          {pendingIntroReviewsQuery.isLoading ? (
            <Loading />
          ) : pendingIntroReviewsQuery.data.length === 0 ? (
            <Empty description="Không có nội dung nào đang chờ duyệt." />
          ) : (
            <div className="admin-request-list">
              {pendingIntroReviewsQuery.data.map((item) => (
                <article key={item.shopId} className="admin-request-card">
                  <div className="admin-request-header">
                    <div>
                      <h3>{item.shopName}</h3>
                      <p className="admin-request-meta">👤 {item.ownerDisplayName}</p>
                    </div>
                    <Tag color="purple">Pending</Tag>
                  </div>

                  <div className="admin-request-body">
                    <p>📍 {item.addressLine}</p>
                    <div className="admin-intro-content">
                      <strong>Nội dung đang chờ duyệt:</strong>
                      <p>{item.pendingIntroduction}</p>
                    </div>

                    <div className="admin-review-section">
                      <TextArea
                        placeholder="Ghi chú review..."
                        autoSize={{ minRows: 2 }}
                        value={introReviewNotes[item.shopId] || ""}
                        onChange={(e) =>
                          setIntroReviewNotes((prev) => ({
                            ...prev,
                            [item.shopId]: e.target.value,
                          }))
                        }
                      />
                      <div className="admin-review-actions">
                        <Button
                          type="primary"
                          loading={introReviewMutation.isPending}
                          onClick={() => handleIntroReview(item.shopId, "approve")}
                        >
                          Duyệt
                        </Button>
                        <Button
                          danger
                          loading={introReviewMutation.isPending}
                          onClick={() => handleIntroReview(item.shopId, "reject")}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>
    );
  }

  function renderStatisticsPanel() {
    const periods = ["7", "30", "90"];
    const metrics = ["visits", "audio"];

    return (
      <div className="admin-stage">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="admin-section-kicker">Phân tích & Thống kê</p>
              <h2>Thống kê tương tác</h2>
              <p>Xem top quán và POI có lượt tương tác cao nhất</p>
            </div>
          </div>

          <div className="admin-filters">
            <div className="admin-filter-group">
              <Text strong>Khoảng thời gian:</Text>
              {periods.map((p) => (
                <Button
                  key={p}
                  type={statsPeriod === p ? "primary" : "default"}
                  onClick={() => setStatsPeriod(p)}
                >
                  {p} ngày
                </Button>
              ))}
            </div>
            <div className="admin-filter-group">
              <Text strong>Chỉ số:</Text>
              {metrics.map((m) => (
                <Button
                  key={m}
                  type={statsMetric === m ? "primary" : "default"}
                  onClick={() => setStatsMetric(m)}
                >
                  {m === "visits" ? "Lượt ghé" : "Audio"}
                </Button>
              ))}
            </div>
          </div>

          <div className="admin-stats-row">
            <div className="admin-stats-col">
              <h3>Top quán</h3>
              {topShopsQuery.isLoading ? (
                <Loading />
              ) : !topShopsQuery.data ? (
                <Loading />
              ) : topShopsQuery.data.length === 0 ? (
                <Empty />
              ) : (
                <Table
                  rowKey="slug"
                  columns={shopsColumns}
                  dataSource={topShopsQuery.data}
                  pagination={false}
                  size="small"
                />
              )}
            </div>

            <div className="admin-stats-col">
              <h3>Top POI</h3>
              {topPoisQuery.isLoading ? (
                <Loading />
              ) : topPoisQuery.data?.length === 0 ? (
                <Empty />
              ) : (
                <Table
                  rowKey={(record) => record.id || record.Id}
                  columns={topPoisColumns}
                  dataSource={Array.isArray(topPoisQuery.data) ? topPoisQuery.data : []}
                  pagination={false}
                  size="small"
                />
              )}
            </div>
          </div>
        </article>
      </div>
    );
  }

  function renderManagePoisPanel() {
    return (
      <div className="admin-stage">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="admin-section-kicker">Quản lý địa điểm</p>
              <h2>Quản lý POI trên bản đồ</h2>
              <p>Thêm, sửa, xóa các điểm địa điểm ẩm thực</p>
            </div>
          </div>

          <div className="admin-table-header">
            <Input
              placeholder="Tìm POI..."
              value={poiSearch}
              onChange={(e) => setPoiSearch(e.target.value)}
              className="admin-search-input"
            />
            <Button
              type="primary"
              onClick={() => {
                setEditingPoi(null);
                setPoiModalVisible(true);
              }}
            >
              + Thêm POI
            </Button>
          </div>

          <Table
            rowKey={(record) => record.id || record.Id}
            loading={poisQuery.isLoading}
            dataSource={
              Array.isArray(poisQuery.data)
                ? poisQuery.data.filter((p) => {
                    const name = p?.Name || p?.displayName || "";
                    return name.toLowerCase().includes(poiSearch.toLowerCase());
                  })
                : []
            }
            columns={managePoisColumns}
            pagination={{ pageSize: 10 }}
          />
        </article>

        {/* POI Modal */}
        <Modal
          title={editingPoi ? "Cập nhật POI" : "Thêm POI"}
          open={poiModalVisible}
          onCancel={() => setPoiModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            layout="vertical"
            initialValues={
              editingPoi
                ? {
                    ...editingPoi,
                    Name: editingPoi.name?.vi || editingPoi.name?.en || editingPoi.shopName || "",
                    description: editingPoi.description?.vi || editingPoi.description?.en || "",
                    shopAddress: editingPoi.shopAddress || "",
                    Latitude: editingPoi.lat ?? editingPoi.location?.lat ?? "",
                    Longitude: editingPoi.lng ?? editingPoi.location?.lng ?? "",
                  }
                : {}
            }
            onFinish={(values) => {
              const payload = {
                name: {
                  vi: values.Name,
                  en: values.Name,
                },
                description: {
                  vi: values.description || "",
                  en: values.description || "",
                },
                shopAddress: values.shopAddress,
                category: editingPoi?.category || "street_food",
                lat: Number(values.Latitude),
                lng: Number(values.Longitude),
                radius: editingPoi?.radius || 35,
                imageUrl: editingPoi?.imageUrl || null,
              };

              if (editingPoi) {
                poiUpdateMutation.mutate({
                  id: editingPoi.id || editingPoi.Id,
                  data: payload,
                });
              } else {
                poiCreateMutation.mutate(payload);
              }
              setPoiModalVisible(false);
            }}
          >
            <Form.Item
              name="Name"
              label="Tên"
              rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
            >
              <Input placeholder="Nhập tên quán/địa điểm" />
            </Form.Item>

            <Form.Item
              name="shopAddress"
              label="Địa chỉ"
              rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
            >
              <Input placeholder="Nhập địa chỉ đầy đủ" />
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
              <TextArea rows={3} placeholder="Nhập mô tả về địa điểm này..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="Latitude"
                  label="Vĩ độ (Latitude)"
                  rules={[{ required: true, message: "Thiếu vĩ độ!" }]}
                >
                  <Input placeholder="VD: 10.758995" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="Longitude"
                  label="Kinh độ (Longitude)"
                  rules={[{ required: true, message: "Thiếu kinh độ!" }]}
                >
                  <Input placeholder="VD: 106.703621" />
                </Form.Item>
              </Col>
            </Row>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={poiCreateMutation.isPending || poiUpdateMutation.isPending}
            >
              {editingPoi ? "Lưu cập nhật" : "Thêm POI"}
            </Button>
          </Form>
        </Modal>
      </div>
    );
  }

  function renderFoodToursPanel() {
    return (
      <div className="admin-stage">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <p className="admin-section-kicker">Quản lý lộ trình</p>
              <h2>Food Tours</h2>
              <p>Tạo và quản lý các tour du lịch ẩm thực</p>
            </div>
          </div>

          <Button
            type="primary"
            className="admin-add-tour-btn"
            onClick={() => {
              setTourModalVisible(true);
              setSelectedPois([]);
            }}
          >
            + Tạo lộ trình mới
          </Button>

          <Table
            rowKey="id"
            dataSource={foodToursQuery.data}
            loading={foodToursQuery.isLoading}
            columns={tourColumns}
            pagination={{ pageSize: 5 }}
          />
        </article>

        {/* Create Tour Modal */}
        <Modal
          title="Tạo lộ trình du lịch mới"
          open={tourModalVisible}
          onCancel={() => setTourModalVisible(false)}
          width={800}
          footer={null}
          destroyOnClose
        >
          <Form
            layout="vertical"
            onFinish={(values) => {
              const payload = {
                title: {
                  vi: values.title,
                  en: values.title,
                },
                description: {
                  vi: values