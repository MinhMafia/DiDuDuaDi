import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  BarChartOutlined,
  CompassOutlined,
  DashboardOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
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
  getActiveVisitorsCount,
  getTotalVisitorsCount,
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const activeVisitorsQuery = useQuery({
    queryKey: ["activeVisitors", 5],
    queryFn: () => getActiveVisitorsCount(5),
    refetchInterval: 60_000,
  });

  const totalVisitorsQuery = useQuery({
    queryKey: ["totalVisitors"],
    queryFn: getTotalVisitorsCount,
    refetchInterval: 60_000,
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
  const activeVisitorsCount = activeVisitorsQuery.data ?? 0;
  const totalVisitorsCount = totalVisitorsQuery.data ?? 0;
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
      name: "Live",
      value: activeVisitorsCount,
    },
    {
      name: "Total",
      value: totalVisitorsCount,
    },
  ];

  const ADMIN_SECTION_ICONS = {
    overview: <DashboardOutlined />,
    ownerRequests: <ShopOutlined />,
    shopIntros: <FileDoneOutlined />,
    statistics: <BarChartOutlined />,
    managePois: <EnvironmentOutlined />,
    foodTours: <CompassOutlined />,
  };

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

  async function handleRefreshDashboard() {
    setIsRefreshing(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["shop-intro-reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["topShops"] }),
        queryClient.invalidateQueries({ queryKey: ["pois"] }),
        queryClient.invalidateQueries({ queryKey: ["foodTours"] }),
        queryClient.invalidateQueries({ queryKey: ["activeVisitors"] }),
        queryClient.invalidateQueries({ queryKey: ["totalVisitors"] }),
      ]);
      message.success("Đã làm mới dữ liệu admin");
    } catch {
      message.error("Không thể làm mới dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleExportStatistics() {
    const rows = topShopsQuery.data ?? [];

    if (rows.length === 0) {
      message.warning("Chưa có dữ liệu thống kê để xuất.");
      return;
    }

    const metricLabel = statsMetric === "audio" ? "Audio" : "Lượt xem";
    const generatedAt = new Date();
    const tableRows = rows
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeExcelCell(resolveActivityName(item))}</td>
            <td>${escapeExcelCell(item.slug || "-")}</td>
            <td>${escapeExcelCell(item.latitude ?? item.lat ?? "-")}</td>
            <td>${escapeExcelCell(item.longitude ?? item.lng ?? "-")}</td>
            <td>${escapeExcelCell(metricLabel)}</td>
            <td>${escapeExcelCell(item.count ?? 0)}</td>
          </tr>
        `,
      )
      .join("");

    const workbookHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; }
            th { background: #dbeafe; font-weight: 700; }
            .title { background: #2563eb; color: #ffffff; font-size: 18px; }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <th class="title" colspan="7">Báo cáo thống kê top quán</th>
            </tr>
            <tr>
              <td colspan="7">Khoảng thời gian: ${escapeExcelCell(statsPeriod)} ngày</td>
            </tr>
            <tr>
              <td colspan="7">Chỉ số: ${escapeExcelCell(metricLabel)}</td>
            </tr>
            <tr>
              <td colspan="7">Ngày xuất: ${escapeExcelCell(generatedAt.toLocaleString("vi-VN"))}</td>
            </tr>
            <tr>
              <th>STT</th>
              <th>Tên quán</th>
              <th>Slug</th>
              <th>Vĩ độ</th>
              <th>Kinh độ</th>
              <th>Chỉ số</th>
              <th>Số lượt</th>
            </tr>
            ${tableRows}
          </table>
        </body>
      </html>
    `;

    downloadTextFile(
      workbookHtml,
      `thong-ke-top-quan-${statsPeriod}-ngay-${statsMetric}-${formatFileDate(generatedAt)}.xls`,
      "application/vnd.ms-excel;charset=utf-8",
    );
    message.success("Đã xuất file Excel thống kê.");
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
  function renderActivityCard() {
    const metricLabel = statsMetric === "audio" ? "Audio" : "Lượt xem";
    const topShopRows = topShopsQuery.data ?? [];
    const chartRows = topShopRows.length
      ? topShopRows.slice(0, 6).map((item) => ({
          name: item.name || item.slug || "Quán",
          value: item.count ?? 0,
        }))
      : overviewChartData;

    return (
      <Card className="admin-activity-card">
        <div className="admin-activity-head">
          <div>
            <p className="admin-section-kicker">Hoạt động</p>
            <h3>Hoạt động {statsPeriod} ngày</h3>
            <p>Theo dõi {metricLabel.toLowerCase()} nổi bật của các quán.</p>
          </div>
          <div className="admin-activity-filters">
            <div className="admin-filter-group" aria-label="Khoảng thời gian">
              {["7", "30"].map((period) => (
                <button
                  key={period}
                  type="button"
                  className={statsPeriod === period ? "active" : ""}
                  onClick={() => setStatsPeriod(period)}
                >
                  {period} ngày
                </button>
              ))}
            </div>
            <div className="admin-filter-group" aria-label="Chỉ số">
              {[
                ["visits", "Lượt xem"],
                ["audio", "Audio"],
              ].map(([metric, label]) => (
                <button
                  key={metric}
                  type="button"
                  className={statsMetric === metric ? "active" : ""}
                  onClick={() => setStatsMetric(metric)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-activity-layout">
          <div className="admin-activity-chart">
            <ResponsiveContainer width="100%" height={330}>
              <AreaChart data={chartRows} margin={{ top: 18, right: 18, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="adminActivityArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.32} />
                    <stop offset="56%" stopColor="#10B981" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ stroke: "#2563EB", strokeWidth: 1.5 }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fill="url(#adminActivityArea)"
                  activeDot={{ r: 5, stroke: "#10B981", strokeWidth: 3, fill: "#ffffff" }}
                  dot={{ r: 3, stroke: "#2563EB", strokeWidth: 2, fill: "#ffffff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-top-lists">
            <TopActivityList
              emptyText="Chưa có dữ liệu top quán."
              isLoading={topShopsQuery.isLoading}
              items={topShopRows}
              subtitle="Gộp lượt theo từng quán"
              title="Top quán"
            />
          </div>
        </div>
      </Card>
    );
  }

  function renderOverviewPanel() {
    return (
      <div className="admin-overview-grid">
        <Card className="stat-card stat-owner">
          <div className="stat-card-body">
            <div className="stat-card-top">
              <div className="stat-icon">
                <UserOutlined />
              </div>
              <h2>{pendingOwnerCount}</h2>
            </div>
            <p>Yêu cầu chủ quán đang chờ</p>
          </div>
        </Card>

        <Card className="stat-card stat-review">
          <div className="stat-card-body">
            <div className="stat-card-top">
              <div className="stat-icon">
                <FileTextOutlined />
              </div>
              <h2>{pendingIntroCount}</h2>
            </div>
            <p>Nội dung quán đang chờ duyệt</p>
          </div>
        </Card>

        <Card className="stat-card stat-poi">
          <div className="stat-card-body">
            <div className="stat-card-top">
              <div className="stat-icon">
                <EnvironmentOutlined />
              </div>
              <h2>{totalPois}</h2>
            </div>
            <p>Tổng số POI trên bản đồ</p>
          </div>
        </Card>

        <Card className="stat-card stat-live">
          <div className="stat-card-body">
            <div className="stat-card-top">
              <div className="stat-icon">
                <TeamOutlined />
              </div>
              <h2>{activeVisitorsCount}</h2>
            </div>
            <p>Đang truy cập trong 5 phút</p>
          </div>
        </Card>

        <Card className="stat-card stat-total">
          <div className="stat-card-body">
            <div className="stat-card-top">
              <div className="stat-icon">
                <TeamOutlined />
              </div>
              <h2>{totalVisitorsCount}</h2>
            </div>
            <p>Tổng người đã từng truy cập</p>
          </div>
        </Card>

        {renderActivityCard()}
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
    const topShopRows = topShopsQuery.data ?? [];

    return (
      <div className="admin-panel admin-report-panel">
        <div className="admin-panel-header">
          <div>
            <p className="admin-section-kicker">Báo cáo</p>
            <h2>Xuất thống kê Excel</h2>
            <p>Xuất danh sách top quán theo khoảng thời gian và chỉ số đã chọn.</p>
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={topShopsQuery.isFetching}
            onClick={handleExportStatistics}
          >
            Xuất Excel
          </Button>
        </div>

        <Card className="admin-report-card">
          <div className="admin-report-toolbar">
            <div>
              <h3>Dữ liệu xuất báo cáo</h3>
              <p>
                {statsMetric === "audio" ? "Audio" : "Lượt xem"} trong{" "}
                {statsPeriod} ngày gần nhất.
              </p>
            </div>
            <div className="admin-activity-filters">
              <div className="admin-filter-group" aria-label="Khoảng thời gian">
                {["7", "30"].map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={statsPeriod === period ? "active" : ""}
                    onClick={() => setStatsPeriod(period)}
                  >
                    {period} ngày
                  </button>
                ))}
              </div>
              <div className="admin-filter-group" aria-label="Chỉ số">
                {[
                  ["visits", "Lượt xem"],
                  ["audio", "Audio"],
                ].map(([metric, label]) => (
                  <button
                    key={metric}
                    type="button"
                    className={statsMetric === metric ? "active" : ""}
                    onClick={() => setStatsMetric(metric)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Table
            rowKey={(record, index) => record.slug || `${record.name}-${index}`}
            loading={topShopsQuery.isLoading}
            dataSource={topShopRows}
            pagination={false}
            size="middle"
            columns={[
              {
                title: "STT",
                width: 70,
                render: (_, __, index) => index + 1,
              },
              {
                title: "Tên quán",
                dataIndex: "name",
                render: (text) => <strong>{text || "N/A"}</strong>,
              },
              {
                title: "Slug",
                dataIndex: "slug",
                render: (text) => text || "-",
              },
              {
                title: statsMetric === "audio" ? "Số lượt audio" : "Số lượt xem",
                dataIndex: "count",
                align: "right",
                render: (count) => <Tag color="blue">{count ?? 0}</Tag>,
              },
            ]}
          />
        </Card>
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
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">
            {t("admin.badge") || "Quản trị hệ thống"}
          </p>
          <h1>Bảng điều khiển admin</h1>
          <p>Quản lý yêu cầu, nội dung, POI, tour và số liệu hoạt động.</p>
        </div>

        <div className="admin-topbar-actions">
          <Tag className="admin-user-tag">
            {currentUser?.displayName ||
              currentUser?.username ||
              currentUser?.email ||
              "Admin"}
          </Tag>
          <Button
            icon={<ReloadOutlined />}
            loading={isRefreshing}
            onClick={handleRefreshDashboard}
          >
            Làm mới
          </Button>
        </div>
      </header>

      {feedback ? <div className="admin-feedback">{feedback}</div> : null}

      <div className="admin-shell">
        <aside className="admin-nav">
          <nav className="admin-nav-card" aria-label="Chức năng admin">
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
                  <span className="admin-nav-icon">
                    {ADMIN_SECTION_ICONS[section.id]}
                  </span>
                  <div className="admin-nav-button-copy">
                    <strong>{section.label}</strong>
                  </div>
                  <span className="admin-nav-badge">{section.badge}</span>
                </button>
              ))}
            </div>
          </nav>
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

function TopActivityList({ emptyText, isLoading, items, subtitle, title }) {
  const rows = (items ?? []).slice(0, 5);

  return (
    <div className="admin-top-list">
      <div className="admin-top-list-head">
        <h4>{title}</h4>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="admin-top-list-rows">
          {rows.map((item, index) => (
            <div
              className="admin-top-list-row"
              key={
                item.id ||
                item.Id ||
                item.slug ||
                item.shopId ||
                `${title}-${index}`
              }
            >
              <span>{index + 1}</span>
              <strong>{resolveActivityName(item)}</strong>
              <em>{item.count ?? item.views ?? item.audioCount ?? 0}</em>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function resolveActivityName(item) {
  const name =
    item?.name || item?.Name || item?.shopName || item?.displayName || item?.slug;

  if (typeof name === "object" && name !== null) {
    return name.vi || name.en || "N/A";
  }

  return name || "N/A";
}

function escapeExcelCell(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatFileDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("");
}

function downloadTextFile(content, fileName, mimeType) {
  const blob = new Blob(["\ufeff", content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : String(value);
}
