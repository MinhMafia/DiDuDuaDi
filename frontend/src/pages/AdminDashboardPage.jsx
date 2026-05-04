import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Cell } from "recharts";
import { CrownOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  UserOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { Card } from "antd";
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
  Descriptions,
} from "antd";
import Loading from "../components/common/Loading";
import PoiQrCard from "../components/common/PoiQrCard";
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
  getPoiById,
} from "../services/analyticsService";

import "./AdminDashboardPage.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

const EMPTY_POI = {
  name: "",
  description: "",
  category: "street_food",
  shopAddress: "",
  lat: "",
  lng: "",
};

const EMPTY_TOUR = {
  title: "",
  category: "",
  description: "",
};
const COLORS = [
  "#468bfa", // xanh chính
  "#6366f1", // tím xanh
  "#22c55e", // xanh lá
  "#f59e0b", // cam
];
// Tạo URL chi tiết POI cho QR code
export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);

  const [activeSection, setActiveSection] = useState("overview");
  const [feedback, setFeedback] = useState("");

  // POI Detail modal state
  const [poiDetailVisible, setPoiDetailVisible] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState(null);

  // Owner review states
  const [ownerReviewNotes, setOwnerReviewNotes] = useState({});
  const [introReviewNotes, setIntroReviewNotes] = useState({});

  // Stats states
  const [statsPeriod, setStatsPeriod] = useState("30");
  const [statsMetric, setStatsMetric] = useState("visits");

  // POI manage states
  const [poiModalVisible, setPoiModalVisible] = useState(false);
  const [editingPoi, setEditingPoi] = useState(null);
  const [poiSearch, setPoiSearch] = useState("");
  const [poiForm, setPoiForm] = useState(EMPTY_POI);

  // Tour states
  const [tourModalVisible, setTourModalVisible] = useState(false);
  const [editTourModalVisible, setEditTourModalVisible] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [selectedPois, setSelectedPois] = useState([]);
  const [tourForm, setTourForm] = useState(EMPTY_TOUR);

  // ================= QUERY =================
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
        displayName: p.name?.vi || p.name?.en || Object.values(p.name || {})[0],
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

  // Query lấy chi tiết POI
  const poiDetailQuery = useQuery({
    queryKey: ["poi-detail", selectedPoiId],
    queryFn: () => getPoiById(selectedPoiId),
    enabled: !!selectedPoiId && poiDetailVisible,
    select: (res) => res.data ?? null,
  });

  // ================= MUTATION =================
  const ownerReviewMutation = useMutation({
    mutationFn: ({ requestId, action, reason }) =>
      reviewOwnerUpgradeRequest(requestId, action, reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests"] });
      setFeedback(response.message || "Đã xử lý yêu cầu chủ quán");
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (requestId) => confirmOwnerUpgradePayment(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests"] });
      setFeedback("Đã kích hoạt quyền chủ quán");
    },
  });

  const cancelPaymentMutation = useMutation({
    mutationFn: (requestId) => cancelOwnerUpgradePayment(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests"] });
      setFeedback("Đã hủy mã QR");
    },
  });

  const introReviewMutation = useMutation({
    mutationFn: ({ shopId, action, reason }) =>
      reviewShopIntro(shopId, action, reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["shop-intro-reviews"] });
      setFeedback(response.message || "Đã duyệt nội dung quán");
    },
  });

  const poiCreateMutation = useMutation({
    mutationFn: createPoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
      setPoiForm(EMPTY_POI);
      setFeedback("Đã tạo POI thành công");
    },
  });

  const poiUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePoi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
      setPoiForm(EMPTY_POI);
      setEditingPoi(null);
      setFeedback("Đã cập nhật POI thành công");
    },
  });

  const poiDeleteMutation = useMutation({
    mutationFn: deletePoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
      setFeedback("Đã xóa POI thành công");
    },
  });

  const tourCreateMutation = useMutation({
    mutationFn: createFoodTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodTours"] });
      setTourForm(EMPTY_TOUR);
      setSelectedPois([]);
      setTourModalVisible(false);
      setFeedback("Đã tạo tour thành công");
    },
  });

  const tourUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => updateFoodTour(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodTours"] });
      setEditingTour(null);
      setSelectedPois([]);
      setEditTourModalVisible(false);
      setFeedback("Đã cập nhật tour thành công");
    },
  });

  const tourDeleteMutation = useMutation({
    mutationFn: deleteFoodTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodTours"] });
      setFeedback("Đã xóa tour thành công");
    },
  });

  // ================= DERIVED DATA =================
  const pendingOwnerCount = pendingOwnerRequestsQuery.data?.length ?? 0;
  const pendingIntroCount = pendingIntroReviewsQuery.data?.length ?? 0;
  const totalPois = poisQuery.data?.length ?? 0;
  const totalTours = foodToursQuery.data?.length ?? 0;
const overviewChartData = [
  {
    name: "Owner",
    value: pendingOwnerCount,
  },
  {
    name: "Intro",
    value: pendingIntroCount,
  },
  {
    name: "POI",
    value: totalPois,
  },
  {
    name: "Tour",
    value: totalTours,
  },
];
  // ================= SECTIONS =================
  const sections = [
    {
      id: "overview",
      label: t("admin.sections.overview") || "Tổng quan",
      kicker: t("admin.sections.overviewKicker") || "Tổng quan hệ thống",
      description:
        t("admin.sections.overviewDescription") ||
        "Xem nhanh các yêu cầu đang chờ và thống kê cơ bản.",
      badge: `${pendingOwnerCount + pendingIntroCount} đang chờ`,
    },
    {
      id: "ownerRequests",
      label: t("admin.sections.ownerRequests") || "Duyệt chủ quán",
      kicker: t("admin.sections.ownerRequestsKicker") || "Yêu cầu nâng quyền",
      description:
        t("admin.sections.ownerRequestsDescription") ||
        "Phê duyệt hoặc từ chối yêu cầu trở thành chủ quán.",
      badge:
        pendingOwnerCount > 0 ? `${pendingOwnerCount} đang chờ` : "Không có",
    },
    {
      id: "shopIntros",
      label: t("admin.sections.shopIntros") || "Duyệt nội dung",
      kicker: t("admin.sections.shopIntrosKicker") || "Nội dung giới thiệu",
      description:
        t("admin.sections.shopIntrosDescription") ||
        "Kiểm duyệt nội dung giới thiệu quán trước khi hiển thị.",
      badge:
        pendingIntroCount > 0 ? `${pendingIntroCount} đang chờ` : "Không có",
    },
    {
      id: "statistics",
      label: t("admin.sections.statistics") || "Thống kê",
      kicker: t("admin.sections.statisticsKicker") || "Top quán & POI",
      description:
        t("admin.sections.statisticsDescription") ||
        "Xem top quán và địa điểm được tương tác nhiều nhất.",
      badge: `${statsPeriod} ngày`,
    },
    {
      id: "managePois",
      label: t("admin.sections.managePois") || "Quản lý POI",
      kicker: t("admin.sections.managePoisKicker") || "Địa điểm trên bản đồ",
      description:
        t("admin.sections.managePoisDescription") ||
        "Thêm, sửa, xóa các điểm POI hiển thị trên bản đồ.",
      badge: `${totalPois} POI`,
    },
    {
      id: "foodTours",
      label: t("admin.sections.foodTours") || "Quản lý Tour",
      kicker: t("admin.sections.foodToursKicker") || "Lộ trình du lịch",
      description:
        t("admin.sections.foodToursDescription") ||
        "Tạo và quản lý các tour du lịch ẩm thực.",
      badge: `${totalTours} tour`,
    },
  ];

  const activeSectionMeta =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  // ================= HANDLERS =================
  function handlePoiSubmit() {
    setFeedback("");

    const payload = {
      name: {
        vi: poiForm.name,
        en: poiForm.name,
      },
      description: {
        vi: poiForm.description || "",
        en: poiForm.description || "",
      },
      shopAddress: poiForm.shopAddress,
      category: poiForm.category || "street_food",
      lat: Number(poiForm.lat),
      lng: Number(poiForm.lng),
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
  }

  function handleDeletePoi(poiId) {
    Modal.confirm({
      title: "Xóa POI?",
      content: "Bạn có chắc chắn muốn xóa điểm này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        poiDeleteMutation.mutate(poiId);
      },
    });
  }

  function openPoiDetail(poiId) {
    setSelectedPoiId(poiId);
    setPoiDetailVisible(true);
  }

  function openCreateTourModal() {
    setTourForm(EMPTY_TOUR);
    setSelectedPois([]);
    setEditingTour(null);
    setTourModalVisible(true);
  }

  function openEditTourModal(tour) {
    setEditingTour(tour);
    setTourForm({
      title: tour.title?.vi || "",
      category: tour.category || "",
      description: tour.description?.vi || "",
    });
    setSelectedPois(
      (tour.steps ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((step) => step.poiId),
    );
    setEditTourModalVisible(true);
  }

  function handleTourSubmit() {
    setFeedback("");

    const payload = {
      title: {
        vi: tourForm.title,
        en: tourForm.title,
      },
      description: {
        vi: tourForm.description || "",
        en: tourForm.description || "",
      },
      category: tourForm.category?.trim(),
      steps: selectedPois.map((id, index) => ({
        poiId: id,
        order: index + 1,
      })),
    };

    if (editingTour) {
      tourUpdateMutation.mutate({
        id: editingTour.id,
        data: payload,
      });
    } else {
      tourCreateMutation.mutate(payload);
    }
  }

  function handleDeleteTour(tourId) {
    Modal.confirm({
      title: "Xóa tour?",
      content: "Bạn có chắc chắn muốn xóa tour này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        tourDeleteMutation.mutate(tourId);
      },
    });
  }

  function handlePoiEdit(poi) {
    setEditingPoi(poi);
    setPoiForm({
      name: poi.name?.vi || poi.name?.en || poi.shopName || "",
      description: poi.description?.vi || poi.description?.en || "",
      category: poi.category || "street_food",
      shopAddress: poi.shopAddress || "",
      lat: poi.lat ?? poi.location?.lat ?? "",
      lng: poi.lng ?? poi.location?.lng ?? "",
    });
    setPoiModalVisible(true);
  }

  // ================= RENDER PANELS =================
  function renderOverviewPanel() {
    return (
     <div className="admin-overview-grid">
  <Card className="stat-card stat-purple">
    <div className="stat-content">
      <div className="stat-icon">
        <UserOutlined />
      </div>
      <div>
        <h2>{pendingOwnerCount}</h2>
        <p>Yêu cầu chủ quán đang chờ</p>
      </div>
    </div>
  </Card>

  <Card className="stat-card stat-orange">
    <div className="stat-content">
      <div className="stat-icon">
        <FileTextOutlined />
      </div>
      <div>
        <h2>{pendingIntroCount}</h2>
        <p>Nội dung quán đang chờ duyệt</p>
      </div>
    </div>
  </Card>

  <Card className="stat-card stat-blue">
    <div className="stat-content">
      <div className="stat-icon">
        <EnvironmentOutlined />
      </div>
      <div>
        <h2>{totalPois}</h2>
        <p>Tổng số POI trên bản đồ</p>
      </div>
    </div>
  </Card>

  <Card className="stat-card stat-green">
    <div className="stat-content">
      <div className="stat-icon">
        <RocketOutlined />
      </div>
      <div>
        <h2>{totalTours}</h2>
        <p>Tour du lịch đã tạo</p>
      </div>
    </div>
  </Card>
   {/* CHART */}
   <Card className="admin-chart" style={{ marginTop: 24 }}>
        <h3 className="admin-chart-title" style={{ marginBottom: 200 }}>Thống kê tổng quan</h3>

        <ResponsiveContainer width="100%" height={300}>
  <BarChart data={overviewChartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />

    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
      {overviewChartData.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={COLORS[index % COLORS.length]}
        />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
      </Card>
      
</div>
    );
  }

  function renderOwnerRequestsPanel() {
    const requests = pendingOwnerRequestsQuery.data ?? [];
    const isLoading = pendingOwnerRequestsQuery.isLoading;

    return (
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <p className="admin-section-kicker">
              {t("admin.sections.ownerRequestsKicker")}
            </p>
            <h2>{t("admin.sections.ownerRequests")}</h2>
            <p>{t("admin.sections.ownerRequestsDescription")}</p>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : requests.length === 0 ? (
          <Empty description={t("admin.emptyPendingOwnerRequests")} />
        ) : (
          <div className="admin-cards-list">
            {requests.map((request) => (
              <div className="admin-card" key={request.id}>
                <h3>{request.shopName}</h3>
                <p>
                  <Text type="secondary">
                    👤 {request.username} - {request.displayName}
                  </Text>
                </p>
                <p>
                  <Text type="secondary">📍 {request.addressLine}</Text>
                </p>
                {(request.latitude !== null &&
                  request.latitude !== undefined) ||
                (request.longitude !== null &&
                  request.longitude !== undefined) ? (
                  <p>
                    <Text type="secondary">
                      🧭 {formatCoordinate(request.latitude)},{" "}
                      {formatCoordinate(request.longitude)}
                    </Text>
                  </p>
                ) : null}
                {request.note && <p>📝 {request.note}</p>}

                {request.status === "payment_pending" ? (
                  <div className="admin-card-actions">
                    {request.paymentReferenceCode ? (
                      <p>QR: {request.paymentReferenceCode}</p>
                    ) : null}
                    {request.paymentQrImageUrl ? (
                      <img
                        src={request.paymentQrImageUrl}
                        alt="Payment QR"
                        className="admin-qr-image"
                      />
                    ) : null}
                    <div className="admin-card-actions">
                      <Button
                        type="primary"
                        loading={confirmPaymentMutation.isPending}
                        onClick={() =>
                          confirmPaymentMutation.mutate(request.id)
                        }
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
                  <div className="admin-card-actions">
                    <TextArea
                      placeholder={t("admin.reviewNotePlaceholder")}
                      autoSize={{ minRows: 2 }}
                      value={ownerReviewNotes[request.id] || ""}
                      onChange={(e) =>
                        setOwnerReviewNotes((prev) => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))
                      }
                    />
                    <div className="admin-card-actions">
                      <Button
                        type="primary"
                        loading={ownerReviewMutation.isPending}
                        onClick={() =>
                          ownerReviewMutation.mutate({
                            requestId: request.id,
                            action: "approve",
                            reason: ownerReviewNotes[request.id],
                          })
                        }
                      >
                        Tạo QR thanh toán
                      </Button>
                      <Button
                        danger
                        loading={ownerReviewMutation.isPending}
                        onClick={() =>
                          ownerReviewMutation.mutate({
                            requestId: request.id,
                            action: "reject",
                            reason: ownerReviewNotes[request.id],
                          })
                        }
                      >
                        Từ chối
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderShopIntrosPanel() {
    const intros = pendingIntroReviewsQuery.data ?? [];
    const isLoading = pendingIntroReviewsQuery.isLoading;

    return (
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <p className="admin-section-kicker">
              {t("admin.sections.shopIntrosKicker")}
            </p>
            <h2>{t("admin.sections.shopIntros")}</h2>
            <p>{t("admin.sections.shopIntrosDescription")}</p>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : intros.length === 0 ? (
          <Empty description={t("admin.emptyPendingShopIntros")} />
        ) : (
          <div className="admin-cards-list">
            {intros.map((item) => (
              <div className="admin-card" key={item.shopId}>
                <h3>{item.shopName}</h3>
                <p>
                  <Text type="secondary">👤 {item.ownerDisplayName}</Text>
                </p>
                <p>
                  <Text type="secondary">📍 {item.addressLine}</Text>
                </p>
                <p>
                  <strong>Pending:</strong> {item.pendingIntroduction}
                </p>
                <div className="admin-card-actions">
                  <TextArea
                    placeholder="Review note..."
                    autoSize={{ minRows: 2 }}
                    value={introReviewNotes[item.shopId] || ""}
                    onChange={(e) =>
                      setIntroReviewNotes((prev) => ({
                        ...prev,
                        [item.shopId]: e.target.value,
                      }))
                    }
                  />
                  <div className="admin-card-actions">
                    <Button
                      type="primary"
                      loading={introReviewMutation.isPending}
                      onClick={() =>
                        introReviewMutation.mutate({
                          shopId: item.shopId,
                          action: "approve",
                          reason: introReviewNotes[item.shopId],
                        })
                      }
                    >
                      Duyệt
                    </Button>
                    <Button
                      danger
                      loading={introReviewMutation.isPending}
                      onClick={() =>
                        introReviewMutation.mutate({
                          shopId: item.shopId,
                          action: "reject",
                          reason: introReviewNotes[item.shopId],
                        })
                      }
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderStatisticsPanel() {
    return (
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <p className="admin-section-kicker">
              {t("admin.sections.statisticsKicker")}
            </p>
            <h2>{t("admin.sections.statistics")}</h2>
            <p>{t("admin.sections.statisticsDescription")}</p>
          </div>
        </div>

        <div className="admin-filters">
          <Text strong>Khoảng thời gian:</Text>
          {["7", "30", "90"].map((p) => (
            <Button
              key={p}
              type={statsPeriod === p ? "primary" : "default"}
              onClick={() => setStatsPeriod(p)}
            >
              {p} ngày
            </Button>
          ))}
          <Text strong>Chỉ số:</Text>
          {["visits", "audio"].map((m) => (
            <Button
              key={m}
              type={statsMetric === m ? "primary" : "default"}
              onClick={() => setStatsMetric(m)}
            >
              {m}
            </Button>
          ))}
        </div>

        <div className="admin-stats-grid">
          <div className="admin-stats-table">
            <h3>Top quán</h3>
            {topShopsQuery.isLoading ? (
              <Loading />
            ) : topShopsQuery.data?.length === 0 ? (
              <Empty />
            ) : (
              <Table
                rowKey="slug"
                columns={[
                  {
                    title: "Quán",
                    dataIndex: "name",
                    render: (text) => <strong>{text}</strong>,
                  },
                  { title: "Slug", dataIndex: "slug" },
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
                ]}
                dataSource={topShopsQuery.data}
                pagination={false}
                size="small"
              />
            )}
          </div>
          <div className="admin-stats-table">
            <h3>Top POI</h3>
            {topPoisQuery.isLoading ? (
              <Loading />
            ) : topPoisQuery.data?.length === 0 ? (
              <Empty />
            ) : (
              <Table
                rowKey={(record) => record.id || record.Id}
                columns={[
                  {
                    title: "Tên địa điểm",
                    render: (_, record) => (
                      <strong>
                        {record.name || record.Name || record.shopName || "N/A"}
                      </strong>
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
                      return lat
                        ? `${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}`
                        : "N/A";
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
                ]}
                dataSource={topPoisQuery.data}
                pagination={false}
                size="small"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderManagePoisPanel() {
    const pois = poisQuery.data ?? [];
    const filteredPois = pois.filter((p) => {
      const name = p?.displayName || p?.Name || "";
      return name.toLowerCase().includes(poiSearch.toLowerCase());
    });

    return (
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <p className="admin-section-kicker">
              {t("admin.sections.managePoisKicker")}
            </p>
            <h2>{t("admin.sections.managePois")}</h2>
            <p>{t("admin.sections.managePoisDescription")}</p>
          </div>
          <Button
            type="primary"
            onClick={() => {
              setEditingPoi(null);
              setPoiForm(EMPTY_POI);
              setPoiModalVisible(true);
            }}
          >
            + Thêm POI
          </Button>
        </div>

        <div className="admin-search-bar">
          <Input
            placeholder="Tìm POI..."
            value={poiSearch}
            onChange={(e) => setPoiSearch(e.target.value)}
          />
        </div>

        <div className="admin-table-wrapper">
          <Table
            rowKey="Id"
            loading={poisQuery.isLoading}
            dataSource={filteredPois}
            scroll={{ x: 1100 }}
            columns={[
              {
                title: "Tên",
                render: (_, record) => (
                  <strong>
                    {record.displayName ||
                      record.Name ||
                      record.shopName ||
                      "N/A"}
                  </strong>
                ),
                width: 180,
                ellipsis: true,
              },
              {
                title: "Danh mục",
                dataIndex: "category",
                render: (cat) => <Tag color="blue">{cat || "street_food"}</Tag>,
                width: 120,
              },
              {
                title: "Địa chỉ",
                dataIndex: "shopAddress",
                ellipsis: true,
                width: 200,
              },
              {
                title: "Vị trí",
                render: (_, record) => {
                  const lat = record?.lat ?? record?.location?.lat;
                  const lng = record?.lng ?? record?.location?.lng;
                  if (lat == null || lng == null) return "Không có tọa độ";
                  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
                },
                width: 150,
              },
              {
                title: "Bán kính",
                dataIndex: "radius",
                render: (radius) => (radius ? `${radius}m` : "N/A"),
                width: 100,
              },
              {
                title: "Thực đơn",
                dataIndex: "menuItems",
                render: (menuItems) =>
                  menuItems?.length ? (
                    <Tag color="green">{menuItems.length} món</Tag>
                  ) : (
                    "Trống"
                  ),
                width: 100,
              },
              {
                title: "Hành động",
                render: (_, record) => (
                  <Space>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => openPoiDetail(record.id || record.Id)}
                    >
                      Chi tiết
                    </Button>
                    <Button size="small" onClick={() => handlePoiEdit(record)}>
                      Sửa
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={() =>
                        poiDeleteMutation.mutate(record.id || record.Id)
                      }
                    >
                      Xóa
                    </Button>
                  </Space>
                ),
                width: 180,
                fixed: "right",
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </div>
    );
  }

  function renderFoodToursPanel() {
    const tours = foodToursQuery.data ?? [];

    return (
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <p className="admin-section-kicker">
              {t("admin.sections.foodToursKicker")}
            </p>
            <h2>{t("admin.sections.foodTours")}</h2>
            <p>{t("admin.sections.foodToursDescription")}</p>
          </div>
          <Button type="primary" onClick={openCreateTourModal}>
            + Tạo tour mới
          </Button>
        </div>

        <Table
          rowKey="id"
          dataSource={tours}
          loading={foodToursQuery.isLoading}
          columns={[
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
                record.description?.vi ||
                record.description?.en ||
                "Không có mô tả",
            },
            {
              title: "Thao tác",
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => openEditTourModal(record)}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => handleDeleteTour(record.id)}
                  >
                    Xóa
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{ pageSize: 5 }}
        />
      </div>
    );
  }

  function renderActivePanel() {
    if (activeSection === "overview") return renderOverviewPanel();
    if (activeSection === "ownerRequests") return renderOwnerRequestsPanel();
    if (activeSection === "shopIntros") return renderShopIntrosPanel();
    if (activeSection === "statistics") return renderStatisticsPanel();
    if (activeSection === "managePois") return renderManagePoisPanel();
    if (activeSection === "foodTours") return renderFoodToursPanel();
    return renderOverviewPanel();
  }

  // ================= MAIN RENDER =================
  return (
    <section className="admin-page">
     
<header className="admin-hero">
  <div className="admin-hero-copy">
    <div className="admin-hero-top">
      <div className="admin-hero-icon">
        <CrownOutlined />
      </div>

      <p className="admin-kicker">
        {t("admin.badge") || "Quản trị hệ thống"}
      </p>
    </div>

    <h1>{t("admin.title")}</h1>
    <p>{t("admin.subtitle")}</p>

    <Tag className="admin-user-tag">
      {currentUser?.displayName}
    </Tag>
  </div>
</header>

      {feedback ? <div className="admin-feedback">{feedback}</div> : null}

      <div className="admin-shell">
        <aside className="admin-nav">
          <article className="admin-card admin-nav-card">
            <div className="admin-card-head">
              <div>
                <p className="admin-section-kicker">
                  {t("admin.badge") || "Quản trị"}
                </p>
                <h2>{activeSectionMeta.label}</h2>
                <p>{activeSectionMeta.description}</p>
              </div>
            </div>

            <div className="admin-nav-list">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`admin-nav-button ${
                    activeSection === section.id ? "active" : ""
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="admin-nav-button-copy">
                    <span>{section.kicker}</span>
                    <strong>{section.label}</strong>
                    <small>{section.description}</small>
                  </div>
                  <span className="admin-nav-badge">{section.badge}</span>
                </button>
              ))}
            </div>
          </article>
        </aside>

        <div className="admin-stage">{renderActivePanel()}</div>
      </div>

      {/* POI Modal */}
      <Modal
        title={editingPoi ? "Cập nhật POI" : "Thêm POI"}
        open={poiModalVisible}
        onCancel={() => {
          setPoiModalVisible(false);
          setEditingPoi(null);
          setPoiForm(EMPTY_POI);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={handlePoiSubmit}
          initialValues={
            editingPoi
              ? {
                  name: poiForm.name,
                  shopAddress: poiForm.shopAddress,
                  description: poiForm.description,
                  Latitude: poiForm.lat,
                  Longitude: poiForm.lng,
                }
              : {}
          }
        >
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input
              placeholder="Nhập tên quán/địa điểm"
              value={poiForm.name}
              onChange={(e) => setPoiForm({ ...poiForm, name: e.target.value })}
            />
          </Form.Item>

          <Form.Item
            name="shopAddress"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
          >
            <Input
              placeholder="Nhập địa chỉ đầy đủ"
              value={poiForm.shopAddress}
              onChange={(e) =>
                setPoiForm({ ...poiForm, shopAddress: e.target.value })
              }
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              rows={3}
              placeholder="Nhập mô tả về địa điểm này..."
              value={poiForm.description}
              onChange={(e) =>
                setPoiForm({ ...poiForm, description: e.target.value })
              }
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="Latitude"
                label="Vĩ độ (Latitude)"
                rules={[{ required: true, message: "Thiếu vĩ độ!" }]}
              >
                <Input
                  placeholder="VD: 10.758995"
                  value={poiForm.lat}
                  onChange={(e) =>
                    setPoiForm({ ...poiForm, lat: e.target.value })
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="Longitude"
                label="Kinh độ (Longitude)"
                rules={[{ required: true, message: "Thiếu kinh độ!" }]}
              >
                <Input
                  placeholder="VD: 106.703621"
                  value={poiForm.lng}
                  onChange={(e) =>
                    setPoiForm({ ...poiForm, lng: e.target.value })
                  }
                />
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

      {/* Create Tour Modal */}
      <Modal
        title="Tạo lộ trình du lịch mới"
        open={tourModalVisible}
        onCancel={() => {
          setTourModalVisible(false);
          setSelectedPois([]);
          setTourForm(EMPTY_TOUR);
        }}
        width={800}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={handleTourSubmit}>
          <Form.Item
            name="title"
            label="Tên Tour"
            rules={[{ required: true, message: "Vui lòng nhập tên tour" }]}
          >
            <Input
              placeholder="VD: Japanese Food Tour"
              value={tourForm.title}
              onChange={(e) =>
                setTourForm({ ...tourForm, title: e.target.value })
              }
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Chủ đề (Category)"
            rules={[{ required: true }]}
          >
            <Input
              placeholder="VD: japanese, street_food..."
              value={tourForm.category}
              onChange={(e) =>
                setTourForm({ ...tourForm, category: e.target.value })
              }
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả ngắn">
            <Input.TextArea
              placeholder="Mô tả về lộ trình này..."
              value={tourForm.description}
              onChange={(e) =>
                setTourForm({ ...tourForm, description: e.target.value })
              }
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Text strong>
              Chọn địa điểm (Nhấn theo thứ tự bạn muốn khách đi):
            </Text>
            <div className="admin-poi-select-list">
              {poisQuery.isLoading ? (
                <Loading />
              ) : (
                poisQuery.data?.map((poi) => {
                  const isSelected = selectedPois.includes(poi.id);
                  const orderIndex = selectedPois.indexOf(poi.id) + 1;

                  return (
                    <div
                      key={poi.id}
                      className={`admin-poi-card ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPois(
                            selectedPois.filter((id) => id !== poi.id),
                          );
                        } else {
                          setSelectedPois([...selectedPois, poi.id]);
                        }
                      }}
                    >
                      <div className="admin-poi-card-info">
                        <strong>{poi.displayName}</strong>
                        <br />
                        <small>{poi.shopAddress}</small>
                      </div>
                      <Button
                        size="small"
                        type={isSelected ? "primary" : "default"}
                        shape="round"
                      >
                        {isSelected ? `Điểm thứ ${orderIndex}` : "Thêm vào"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
            {selectedPois.length === 0 && (
              <Text type="danger">
                <small>* Vui lòng chọn ít nhất 1 địa điểm</small>
              </Text>
            )}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            disabled={selectedPois.length === 0}
            loading={tourCreateMutation.isPending}
          >
            Xác nhận tạo lộ trình
          </Button>
        </Form>
      </Modal>

      {/* Edit Tour Modal */}
      <Modal
        title="Cập nhật Food Tour"
        open={editTourModalVisible}
        onCancel={() => {
          setEditTourModalVisible(false);
          setEditingTour(null);
          setSelectedPois([]);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={handleTourSubmit}
          initialValues={{
            title: tourForm.title,
            category: tourForm.category,
            description: tourForm.description,
          }}
        >
          <Form.Item name="title" label="Tên Tour" rules={[{ required: true }]}>
            <Input
              value={tourForm.title}
              onChange={(e) =>
                setTourForm({ ...tourForm, title: e.target.value })
              }
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Chủ đề"
            rules={[{ required: true }]}
          >
            <Input
              value={tourForm.category}
              onChange={(e) =>
                setTourForm({ ...tourForm, category: e.target.value })
              }
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              value={tourForm.description}
              onChange={(e) =>
                setTourForm({ ...tourForm, description: e.target.value })
              }
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Text strong>Chọn địa điểm (theo thứ tự):</Text>
            <div className="admin-poi-select-list">
              {poisQuery.isLoading ? (
                <Loading />
              ) : (
                poisQuery.data?.map((poi) => {
                  const isSelected = selectedPois.includes(poi.id);
                  const orderIndex = selectedPois.indexOf(poi.id) + 1;

                  return (
                    <div
                      key={poi.id}
                      className={`admin-poi-card ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPois(
                            selectedPois.filter((id) => id !== poi.id),
                          );
                        } else {
                          setSelectedPois([...selectedPois, poi.id]);
                        }
                      }}
                    >
                      <div className="admin-poi-card-info">
                        <strong>{poi.displayName}</strong>
                        <br />
                        <small>{poi.shopAddress}</small>
                      </div>
                      <Button
                        size="small"
                        type={isSelected ? "primary" : "default"}
                        shape="round"
                      >
                        {isSelected ? `#${orderIndex}` : "Thêm"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={tourUpdateMutation.isPending}
            disabled={selectedPois.length === 0}
          >
            Cập nhật tour
          </Button>
        </Form>
      </Modal>

      {/* POI Detail Modal with QR Code */}
      <Modal
        title="Chi tiết POI"
        open={poiDetailVisible}
        onCancel={() => {
          setPoiDetailVisible(false);
          setSelectedPoiId(null);
        }}
        width={800}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setPoiDetailVisible(false);
              setSelectedPoiId(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        destroyOnClose
      >
        {poiDetailQuery.isLoading ? (
          <Loading />
        ) : poiDetailQuery.data ? (
          <div className="admin-poi-detail">
            <Descriptions
              title={
                <div className="admin-poi-detail-header">
                  <h3>
                    {poiDetailQuery.data.name?.vi ||
                      poiDetailQuery.data.shopName ||
                      "N/A"}
                  </h3>
                  <Tag color="blue">
                    {poiDetailQuery.data.category || "street_food"}
                  </Tag>
                </div>
              }
              bordered
              column={2}
            >
              <Descriptions.Item label="ID">
                <code>{poiDetailQuery.data.id?.slice(-8) || "N/A"}</code>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {poiDetailQuery.data.shopAddress || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Vĩ độ" span={1}>
                {poiDetailQuery.data.lat ??
                  poiDetailQuery.data.location?.lat ??
                  "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Kinh độ" span={1}>
                {poiDetailQuery.data.lng ??
                  poiDetailQuery.data.location?.lng ??
                  "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Bán kính" span={1}>
                {poiDetailQuery.data.radius
                  ? `${poiDetailQuery.data.radius}m`
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Số món" span={1}>
                {poiDetailQuery.data.menuItems?.length || 0} món
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {poiDetailQuery.data.description?.vi ||
                  poiDetailQuery.data.description?.en ||
                  "Chưa có mô tả"}
              </Descriptions.Item>
            </Descriptions>

            {/* QR Code Section */}
            <div className="admin-qr-section">
              <h4>📱 QR Code - Quét để xem chi tiết quán</h4>
              <p className="admin-qr-description">
                Quét mã QR này để xem thông tin chi tiết về quán trên ứng dụng
              </p>
              <PoiQrCard
                poiId={poiDetailQuery.data.id}
                poiName={
                  poiDetailQuery.data.name?.vi ||
                  poiDetailQuery.data.name?.en ||
                  poiDetailQuery.data.shopName
                }
              />
            </div>
          </div>
        ) : (
          <Empty description="Không tìm thấy thông tin POI" />
        )}
      </Modal>
    </section>
  );
}

function formatCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : String(value);
}
