import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Eye,
  Languages,
  LayoutDashboard,
  MapPin,
  Navigation,
  Pencil,
  Printer,
  QrCode,
  Store,
  Trash2,
  Utensils,
  Volume2,
  X,
} from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Loading from "../components/common/Loading";
import PoiQrCard from "../components/common/PoiQrCard";
import {
  createMenuItem,
  deleteMenuItem,
  getOwnerDashboard,
  updateMenuItem,
  updatePoiContent,
  updateShopOpenStatus,
  updateShopProfile,
} from "../services/ownerService";
import {
  buildPoiDetailUrl,
  getInitialPublicBaseUrl,
} from "../utils/publicPoiUrl";
import "leaflet/dist/leaflet.css";
import "./OwnerDashboardPage.css";

const DEFAULT_OWNER_MAP_CENTER = [10.7587, 106.7031];
const OWNER_POI_LANGUAGES = [
  { id: "vi", labelKey: "owner.languageNames.vi", fallback: "Vietnamese" },
  { id: "en", labelKey: "owner.languageNames.en", fallback: "English" },
  { id: "zh", labelKey: "owner.languageNames.zh", fallback: "Chinese" },
  { id: "ja", labelKey: "owner.languageNames.ja", fallback: "Japanese" },
  { id: "ko", labelKey: "owner.languageNames.ko", fallback: "Korean" },
  { id: "fr", labelKey: "owner.languageNames.fr", fallback: "French" },
  { id: "th", labelKey: "owner.languageNames.th", fallback: "Thai" },
];

const OWNER_POI_CATEGORY_OPTIONS = [
  { value: "food", label: "Food" },
  { value: "street_food", label: "Street food" },
  { value: "grilled_food", label: "Grilled food" },
  { value: "seafood", label: "Seafood" },
  { value: "dessert", label: "Dessert" },
  { value: "snack", label: "Snacks" },
  { value: "drinks", label: "Drinks" },
];

const EMPTY_PROFILE = {
  shopName: "",
  description: "",
  pendingIntroduction: "",
  addressLine: "",
  latitude: "",
  longitude: "",
  openingHours: "",
  phone: "",
  imageUrl: "",
};

const EMPTY_MENU_ITEM = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  isAvailable: true,
  displayOrder: 1,
};

const MAX_MENU_IMAGE_URL_LENGTH = 500;

const EMPTY_POI_FORM = {
  category: "food",
  sourceLanguage: "vi",
  sourceName: "",
  sourceDescription: "",
};

export default function OwnerDashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);
  const [activeSection, setActiveSection] = useState("overview");
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_ITEM);
  const [poiForm, setPoiForm] = useState(EMPTY_POI_FORM);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsSeen, setNotificationsSeen] = useState(false);

  useEffect(() => {
    if (!feedback) return undefined;

    const timeoutId = window.setTimeout(() => setFeedback(""), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const dashboardQuery = useQuery({
    queryKey: ["owner-dashboard", currentUser?.username],
    queryFn: () => getOwnerDashboard(),
    enabled: Boolean(currentUser?.username),
    select: (response) => response.data,
  });

  useEffect(() => {
    if (!dashboardQuery.data) return;

    setProfileForm({
      shopName: dashboardQuery.data.shopName || "",
      description: dashboardQuery.data.description || "",
      pendingIntroduction: dashboardQuery.data.pendingIntroduction || "",
      addressLine: dashboardQuery.data.addressLine || "",
      latitude: dashboardQuery.data.latitude ?? "",
      longitude: dashboardQuery.data.longitude ?? "",
      openingHours: dashboardQuery.data.openingHours || "",
      phone: dashboardQuery.data.phone || "",
      imageUrl: dashboardQuery.data.imageUrl || "",
    });

    setPoiForm({
      category: dashboardQuery.data.primaryPoi?.category || "food",
      sourceLanguage: "vi",
      sourceName: dashboardQuery.data.primaryPoi?.nameVi || "",
      sourceDescription: dashboardQuery.data.primaryPoi?.descriptionVi || "",
    });
  }, [dashboardQuery.data]);

  const invalidateDashboard = () =>
    queryClient.invalidateQueries({
      queryKey: ["owner-dashboard", currentUser?.username],
    });

  const profileMutation = useMutation({
    mutationFn: (payload) => updateShopProfile(payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.saved"));
      setMutationError("");
      await invalidateDashboard();
    },
    onError: (error) => setMutationError(getMutationErrorMessage(error, t)),
  });

  const createMenuMutation = useMutation({
    mutationFn: (payload) => createMenuItem(payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuCreated"));
      setMutationError("");
      setMenuForm(EMPTY_MENU_ITEM);
      setEditingMenuItemId(null);
      setIsMenuDialogOpen(false);
      await invalidateDashboard();
    },
    onError: (error) => setMutationError(getMutationErrorMessage(error, t)),
  });

  const updateMenuMutation = useMutation({
    mutationFn: ({ menuItemId, payload }) =>
      updateMenuItem(menuItemId, payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuUpdated"));
      setMutationError("");
      setMenuForm(EMPTY_MENU_ITEM);
      setEditingMenuItemId(null);
      setIsMenuDialogOpen(false);
      await invalidateDashboard();
    },
    onError: (error) => setMutationError(getMutationErrorMessage(error, t)),
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (menuItemId) => deleteMenuItem(menuItemId),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuDeleted"));
      setMutationError("");
      setDeleteTargetItem(null);
      await invalidateDashboard();
    },
    onError: (error) => setMutationError(getMutationErrorMessage(error, t)),
  });

  const poiMutation = useMutation({
    mutationFn: (payload) => updatePoiContent(payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.poiSaved"));
      setMutationError("");
      await invalidateDashboard();
    },
    onError: (error) => setMutationError(getMutationErrorMessage(error, t)),
  });

  const openStatusMutation = useMutation({
    mutationFn: (payload) => updateShopOpenStatus(payload),
    onSuccess: async (response) => {
      setFeedback(
        response.message ||
          (response.data?.isTemporarilyClosed
            ? t("owner.feedback.closed")
            : t("owner.feedback.opened")),
      );
      setMutationError("");
      await invalidateDashboard();
    },
    onError: (error) => setMutationError(getMutationErrorMessage(error, t)),
  });

  const dashboard = dashboardQuery.data;
  const menuItems = dashboard?.menuItems ?? [];
  const stats = dashboard?.stats;
  const primaryPoi = dashboard?.primaryPoi;
  const primaryPoiId = primaryPoi?.poiId || primaryPoi?.id || "";
  const statusTone = getOwnerStatusTone(dashboard?.introReviewStatus);
  const activeStatusLabel = translateOwnerStatus(
    t,
    dashboard?.introReviewStatus,
  );
  const displayShopName = getFriendlyDisplayName(dashboard?.shopName || "");
  const displayPrimaryPoiNameVi = getFriendlyDisplayName(
    primaryPoi?.nameVi || "",
  );
  const primaryPoiCategoryLabel = translateOwnerCategory(
    t,
    primaryPoi?.category,
  );
  const availableMenuCount = menuItems.filter(
    (item) => item.isAvailable,
  ).length;
  const heroSummaryText = getFriendlyOwnerSummary(
    dashboard?.approvedIntroduction ||
      dashboard?.pendingIntroduction ||
      dashboard?.description,
    t("owner.summaryFallback"),
  );
  const standeeSummaryText = getFriendlyOwnerSummary(
    primaryPoi?.descriptionVi ||
      dashboard?.approvedIntroduction ||
      dashboard?.description,
    t("owner.standeeFallback", {
      defaultValue:
        "Scan the code to view the menu, shop information, and latest introduction.",
    }),
  );
  const coverImage =
    dashboard?.imageUrl ||
    menuItems.find((item) => item.imageUrl)?.imageUrl ||
    "";
  const isShopOpen = !dashboard?.isTemporarilyClosed;
  const shopOpenLabel = isShopOpen
    ? t("owner.header.open")
    : t("owner.header.closed");
  const notificationItems = [
    {
      id: "status",
      title: t("owner.notifications.reviewTitle"),
      body: t("owner.notifications.reviewBody", {
        status: activeStatusLabel,
      }),
    },
    primaryPoiId
      ? {
          id: "qr",
          title: t("owner.notifications.qrReadyTitle"),
          body: t("owner.notifications.qrReadyBody"),
        }
      : {
          id: "qr-missing",
          title: t("owner.notifications.qrMissingTitle"),
          body: t("owner.notifications.qrMissingBody"),
        },
    stats?.visitCountToday || stats?.audioPlayCountToday || stats?.qrScanCountToday
      ? {
          id: "today",
          title: t("owner.notifications.todayTitle"),
          body: t("owner.notifications.todayBody", {
            visits: stats?.visitCountToday ?? 0,
            audio: stats?.audioPlayCountToday ?? 0,
            qr: stats?.qrScanCountToday ?? 0,
          }),
        }
      : {
          id: "quiet",
          title: t("owner.notifications.quietTitle"),
          body: t("owner.notifications.quietBody"),
        },
  ];
  const hasUnreadNotifications = notificationItems.length > 0 && !notificationsSeen;
  const qrDetailUrl = primaryPoiId
    ? buildPoiDetailUrl(primaryPoiId, getInitialPublicBaseUrl())
    : "";

  function handleToggleShopOpen() {
    setMutationError("");
    openStatusMutation.mutate({ isTemporarilyClosed: isShopOpen });
  }

  function handleToggleNotifications() {
    setIsNotificationOpen((value) => !value);
    setNotificationsSeen(true);
  }

  const sections = [
    {
      id: "overview",
      label: t("owner.sections.overview"),
      description: t("owner.sections.overviewDescription"),
      badge: activeStatusLabel,
      icon: "overview",
    },
    {
      id: "menu",
      label: t("owner.menuTitle"),
      description: t("owner.menuSubtitle"),
      badge: `${availableMenuCount}/${menuItems.length}`,
      icon: "menu",
    },
    {
      id: "profile",
      label: t("owner.shopInfoTitle"),
      description: t("owner.sections.profileDescription"),
      badge: displayShopName || "--",
      icon: "profile",
    },
    {
      id: "mapInfo",
      label: t("owner.poiTitle"),
      description: t("owner.poiSubtitle"),
      badge: displayPrimaryPoiNameVi || "--",
      icon: "map",
    },
    {
      id: "qr",
      label: t("qr.kicker"),
      description: t("owner.sections.qrDescription"),
      badge: primaryPoiId
        ? t("owner.sections.qrReady")
        : t("owner.sections.qrMissing"),
      icon: "qr",
    },
  ];
  function handleProfileSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setMutationError("");
    profileMutation.mutate({
      ...profileForm,
      latitude:
        profileForm.latitude === "" ? null : Number(profileForm.latitude),
      longitude:
        profileForm.longitude === "" ? null : Number(profileForm.longitude),
    });
  }

  function handlePoiSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setMutationError("");
    if (!poiForm.sourceName.trim() || !poiForm.sourceDescription.trim()) {
      setMutationError(
        t("owner.validation.poiSourceRequired", {
          defaultValue: "Please enter a name and description before saving.",
        }),
      );
      return;
    }
    poiMutation.mutate(poiForm);
  }

  function handleMenuSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setMutationError("");

    const imageValidationMessage = getMenuImageUrlValidationMessage(
      menuForm.imageUrl,
      t,
    );
    if (imageValidationMessage) {
      setMutationError(imageValidationMessage);
      return;
    }

    const payload = buildMenuPayload(menuForm);

    if (editingMenuItemId) {
      updateMenuMutation.mutate({ menuItemId: editingMenuItemId, payload });
      return;
    }

    createMenuMutation.mutate(payload);
  }

  function startEditMenuItem(item) {
    setEditingMenuItemId(item.id);
    setActiveSection("menu");
    setIsMenuDialogOpen(true);
    setMenuForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      imageUrl: item.imageUrl || "",
      isAvailable: Boolean(item.isAvailable),
      displayOrder: item.displayOrder || 0,
    });
  }

  function openCreateMenuDialog() {
    setEditingMenuItemId(null);
    setMenuForm({
      ...EMPTY_MENU_ITEM,
      displayOrder: menuItems.length + 1,
    });
    setIsMenuDialogOpen(true);
  }

  function closeMenuDialog() {
    setIsMenuDialogOpen(false);
    setEditingMenuItemId(null);
    setMenuForm(EMPTY_MENU_ITEM);
  }

  function handleToggleMenuAvailability(item) {
    setMutationError("");
    updateMenuMutation.mutate({
      menuItemId: item.id,
      payload: buildMenuPayload({
        ...item,
        isAvailable: !item.isAvailable,
      }),
    });
  }

  function requestDeleteMenuItem(item) {
    setFeedback("");
    setMutationError("");
    setDeleteTargetItem(item);
  }

  function confirmDeleteMenuItem() {
    if (!deleteTargetItem) return;
    deleteMenuMutation.mutate(deleteTargetItem.id);
  }

  async function handleCopyQrLink() {
    if (!qrDetailUrl) return;

    try {
      await navigator.clipboard.writeText(qrDetailUrl);
      setCopiedQrLink(true);
      window.setTimeout(() => setCopiedQrLink(false), 1600);
    } catch {
      setCopiedQrLink(false);
    }
  }

  function handlePrintStandee() {
    const standee = document.querySelector(".owner-standee");
    if (!standee) return;

    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    const styles = Array.from(
      document.querySelectorAll("style, link[rel='stylesheet']"),
    )
      .map((node) => node.outerHTML)
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>DiDuDuaDi Standee</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            html,
            body {
              width: 100%;
              min-height: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              display: grid;
              place-items: center;
              min-height: 100vh;
            }
            .owner-standee {
              box-sizing: border-box;
              display: grid !important;
              grid-template-rows: auto 1fr;
              width: 148mm !important;
              min-height: 210mm !important;
              margin: 0 auto !important;
              border: 1.5px solid rgba(16, 185, 129, 0.36) !important;
              border-radius: 24px !important;
              box-shadow: none !important;
              background:
                radial-gradient(circle at 10% 0%, rgba(16, 185, 129, 0.18), transparent 38%),
                radial-gradient(circle at 100% 100%, rgba(37, 99, 235, 0.14), transparent 42%),
                #ffffff !important;
            }
            .owner-standee-brand {
              padding: 16mm 16mm 0 !important;
            }
            .owner-standee-brand .owner-shop-image.compact {
              width: 28mm !important;
              min-height: 28mm !important;
              border-radius: 12px !important;
            }
            .owner-standee-brand strong {
              font-size: 19pt !important;
            }
            .owner-standee-body {
              display: grid !important;
              justify-items: center !important;
              align-content: center !important;
              padding: 8mm 16mm 18mm !important;
              text-align: center !important;
            }
            .owner-standee-body .owner-section-kicker {
              margin: 0 0 7mm !important;
              font-size: 17pt !important;
              letter-spacing: 0.14em !important;
            }
            .owner-standee-body h3 {
              width: 100% !important;
              max-width: 108mm !important;
              margin: 0 auto !important;
              font-size: 34pt !important;
              line-height: 1.08 !important;
              text-align: center !important;
            }
            .owner-standee-body > p:not(.owner-section-kicker) {
              width: 100% !important;
              max-width: 106mm !important;
              margin: 7mm auto 12mm !important;
              font-size: 14pt !important;
              line-height: 1.45 !important;
              text-align: center !important;
            }
            .owner-standee .poi-qr-card,
            .owner-standee .poi-qr-body {
              display: grid !important;
              width: auto !important;
              margin: 0 auto !important;
              padding: 0 !important;
              border: 0 !important;
              background: transparent !important;
              box-shadow: none !important;
            }
            .owner-standee .poi-qr-body {
              grid-template-columns: 1fr !important;
              justify-items: center !important;
            }
            .owner-standee .poi-qr-content {
              display: none !important;
            }
            .owner-standee .poi-qr-code-wrap {
              min-width: 0 !important;
              padding: 8mm !important;
              border: 1px solid rgba(148, 163, 184, 0.18) !important;
              border-radius: 18px !important;
              background: #ffffff !important;
              box-shadow: 0 16px 40px rgba(15, 23, 42, 0.10) !important;
            }
            .owner-standee .poi-qr-code-wrap svg {
              width: 44mm !important;
              height: 44mm !important;
              display: block !important;
            }
            @media print {
              body * { visibility: visible !important; }
              .owner-standee {
                position: static !important;
                width: 148mm !important;
                margin: 0 auto !important;
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>${standee.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  }

  function renderOverviewPanel() {
    return (
      <div className="owner-overview">
        <div className="owner-metrics-row">
          <MetricCard
            icon={Utensils}
            label={t("owner.labels.menuCount")}
            value={availableMenuCount}
            hint={`${menuItems.length} ${t("owner.menuTitle").toLowerCase()}`}
            tone="emerald"
          />
          <MetricCard
            icon={Eye}
            label={t("owner.stats.totalVisits")}
            value={stats?.totalVisitCount ?? 0}
            hint={
              t("owner.stats.todayVisits") + `: ${stats?.visitCountToday ?? 0}`
            }
            data={buildSparklineData(
              stats?.totalVisitCount ?? 0,
              stats?.visitCountToday ?? 0,
            )}
            tone="blue"
          />
          <MetricCard
            icon={Volume2}
            label={t("owner.stats.audioPlays")}
            value={stats?.totalAudioPlayCount ?? 0}
            hint={
              t("owner.stats.todayAudio") +
              `: ${stats?.audioPlayCountToday ?? 0}`
            }
            data={buildSparklineData(
              stats?.totalAudioPlayCount ?? 0,
              stats?.audioPlayCountToday ?? 0,
            )}
            tone="mint"
          />
          <MetricCard
            icon={QrCode}
            label={t("owner.stats.qrScans")}
            value={stats?.totalQrScanCount ?? 0}
            hint={
              t("owner.stats.todayQr") + `: ${stats?.qrScanCountToday ?? 0}`
            }
            data={buildSparklineData(
              stats?.totalQrScanCount ?? 0,
              stats?.qrScanCountToday ?? 0,
            )}
            tone="blue"
          />
        </div>

        <div className="owner-overview-grid">
          <section className="owner-section-card owner-shop-spotlight">
            <div className="owner-spotlight-copy">
              <span
                className={`owner-status-pill owner-status-pill-${statusTone}`}
              >
                {activeStatusLabel}
              </span>
              {/* <p className="owner-section-kicker">{t("owner.shopInfoTitle")}</p> */}
              <h2>{displayShopName || t("owner.noShop")}</h2>
              <p>{heroSummaryText}</p>
              <dl className="owner-profile-facts">
                <div>
                  <dt>{t("owner.fields.address")}</dt>
                  <dd>
                    {dashboard.addressLine || t("owner.summaryUnavailable")}
                  </dd>
                </div>
                <div>
                  <dt>{t("owner.fields.hours")}</dt>
                  <dd>
                    {dashboard.openingHours || t("owner.summaryUnavailable")}
                  </dd>
                </div>
                <div>
                  <dt>{t("owner.fields.phone")}</dt>
                  <dd>{dashboard.phone || t("owner.summaryUnavailable")}</dd>
                </div>
              </dl>
              <div className="owner-action-row">
                <button
                  type="button"
                  className="owner-button"
                  onClick={() => setActiveSection("profile")}
                >
                  {t("owner.edit")}
                </button>
                <Link className="owner-button secondary" to="/map">
                  {t("owner.viewMap")}
                </Link>
              </div>
            </div>
            <div className="owner-spotlight-side">
              <ShopImage src={coverImage} label={displayShopName} />
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderMenuPanel() {
    return (
      <div className="owner-menu-layout">
        <section className="owner-section-card">
          <div className="owner-section-head">
            <div>
              <h2>{t("owner.sections.menuList")}</h2>
              <p>{t("owner.sections.menuListDescription")}</p>
            </div>
            <span className="owner-count-pill">
              {availableMenuCount}/{menuItems.length}
            </span>
            <button
              type="button"
              className="owner-button owner-menu-add-button"
              onClick={openCreateMenuDialog}
            >
              {t("owner.addMenu")}
            </button>
          </div>
          <DishMenuGrid
            items={menuItems}
            emptyText={t("owner.empty.menu")}
            onEdit={startEditMenuItem}
            onDelete={requestDeleteMenuItem}
            onToggle={handleToggleMenuAvailability}
            t={t}
          />
        </section>

        {isMenuDialogOpen ? (
          <div className="owner-dialog-backdrop" role="presentation">
            <section
              className="owner-section-card owner-menu-editor owner-dialog-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="owner-menu-dialog-title"
            >
              <div className="owner-section-head owner-dialog-head">
                <div>
                  <p className="owner-section-kicker">
                    {t("owner.sections.menuKicker")}
                  </p>
                  <h2 id="owner-menu-dialog-title">
                    {editingMenuItemId
                      ? t("owner.sections.editMenu")
                      : t("owner.addMenu")}
                  </h2>
                  <p>
                    {editingMenuItemId
                      ? t("owner.menuEditHint", {
                          defaultValue:
                            "Update the dish name, price, image, and visibility.",
                        })
                      : t("owner.menuCreateHint", {
                          defaultValue: "Update the dish details and save.",
                        })}
                  </p>
                </div>
                <button
                  type="button"
                  className="owner-dialog-close"
                  onClick={closeMenuDialog}
                  aria-label={
                    editingMenuItemId
                      ? t("owner.cancelEdit")
                      : t("owner.close", { defaultValue: "Close" })
                  }
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <form className="owner-form" onSubmit={handleMenuSubmit}>
                <div className="owner-menu-form-shell">
                  <div className="owner-menu-form-fields">
                    <div className="owner-form-grid two">
                      <FormInput
                        label={t("owner.fields.menuName")}
                        required
                        placeholder={t("owner.placeholders.menuName", {
                          defaultValue: "Example: Special grilled beef in betel leaf",
                        })}
                        value={menuForm.name}
                        onChange={(value) =>
                          setMenuForm((prev) => ({ ...prev, name: value }))
                        }
                      />
                      <FormInput
                        label={t("owner.fields.price")}
                        type="number"
                        min="0"
                        step="1000"
                        required
                        placeholder="69000"
                        value={menuForm.price}
                        onChange={(value) =>
                          setMenuForm((prev) => ({ ...prev, price: value }))
                        }
                      />
                    </div>

                    <FormTextArea
                      label={t("owner.fields.menuDescription")}
                      rows="4"
                      placeholder={t("owner.placeholders.menuDescription", {
                        defaultValue:
                          "Describe the flavor, portion, or side dishes.",
                      })}
                      value={menuForm.description}
                      onChange={(value) =>
                        setMenuForm((prev) => ({
                          ...prev,
                          description: value,
                        }))
                      }
                    />

                    <div className="owner-form-grid two">
                      <FormInput
                        label={t("owner.fields.imageUrl")}
                        placeholder={t("owner.placeholders.imageUrl", {
                          defaultValue:
                            "Paste an https:// image link, not base64 data",
                        })}
                        value={menuForm.imageUrl}
                        onChange={(value) =>
                          setMenuForm((prev) => ({
                            ...prev,
                            imageUrl: value,
                          }))
                        }
                      />
                      <FormInput
                        label={t("owner.fields.order")}
                        type="number"
                        min="0"
                        value={menuForm.displayOrder}
                        onChange={(value) =>
                          setMenuForm((prev) => ({
                            ...prev,
                            displayOrder: value,
                          }))
                        }
                      />
                    </div>

                    <label className="owner-switch-line owner-menu-visibility">
                      <input
                        type="checkbox"
                        checked={menuForm.isAvailable}
                        onChange={(event) =>
                          setMenuForm((prev) => ({
                            ...prev,
                            isAvailable: event.target.checked,
                          }))
                        }
                      />
                      <span>{t("owner.fields.available")}</span>
                      <small>
                        {menuForm.isAvailable
                          ? t("owner.menuVisibleHint", {
                              defaultValue: "Visitors can see this dish.",
                            })
                          : t("owner.menuHiddenHint", {
                              defaultValue: "This dish is hidden from visitors.",
                            })}
                      </small>
                    </label>
                  </div>

                  <aside className="owner-menu-preview-panel">
                    <p className="owner-section-kicker">
                      {t("owner.preview.kicker", { defaultValue: "Preview" })}
                    </p>
                    <h3>
                      {t("owner.menuPreviewTitle", {
                        defaultValue: "Public dish preview",
                      })}
                    </h3>
                    <DishPreviewCard item={menuForm} t={t} />
                  </aside>
                </div>

                <div className="owner-action-row owner-dialog-actions">
                  <button
                    type="submit"
                    className="owner-button"
                    disabled={
                      createMenuMutation.isPending ||
                      updateMenuMutation.isPending
                    }
                  >
                    {createMenuMutation.isPending || updateMenuMutation.isPending
                      ? t("owner.saving")
                      : editingMenuItemId
                        ? t("owner.updateMenu")
                        : t("owner.addMenu")}
                  </button>
                  <button
                    type="button"
                    className="owner-button secondary"
                    onClick={closeMenuDialog}
                  >
                    {editingMenuItemId
                      ? t("owner.cancelEdit")
                      : t("owner.close", { defaultValue: "Close" })}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {deleteTargetItem ? (
          <div
            className="owner-dialog-backdrop owner-alert-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setDeleteTargetItem(null);
              }
            }}
          >
            <section
              className="owner-section-card owner-dialog-panel owner-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="owner-delete-dialog-title"
            >
              <div className="owner-confirm-head">
                <div className="owner-confirm-icon" aria-hidden="true">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="owner-section-kicker">
                    {t("owner.deleteConfirm.kicker", {
                      defaultValue: "Confirm delete",
                    })}
                  </p>
                  <h2 id="owner-delete-dialog-title">
                    {t("owner.deleteConfirm.title", {
                      defaultValue: "Delete this dish?",
                    })}
                  </h2>
                </div>
                <button
                  type="button"
                  className="owner-dialog-close owner-confirm-close"
                  onClick={() => setDeleteTargetItem(null)}
                  disabled={deleteMenuMutation.isPending}
                  aria-label={t("owner.close", { defaultValue: "Close" })}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <p className="owner-confirm-message">
                {t("owner.deleteConfirm.body", {
                  defaultValue:
                    "This dish will be removed from the menu and hidden from visitors.",
                })}
              </p>

              <div className="owner-delete-item-preview">
                <div className="owner-delete-item-image">
                  {deleteTargetItem.imageUrl ? (
                    <img
                      src={deleteTargetItem.imageUrl}
                      alt={getFriendlyDisplayName(deleteTargetItem.name)}
                    />
                  ) : (
                    <div className="owner-image-fallback">
                      {buildInitials(deleteTargetItem.name)}
                    </div>
                  )}
                </div>
                <div>
                  <strong>{getFriendlyDisplayName(deleteTargetItem.name)}</strong>
                  <span>{formatCurrency(deleteTargetItem.price)}</span>
                </div>
              </div>

              <div className="owner-action-row">
                <button
                  type="button"
                  className="owner-button secondary"
                  onClick={() => setDeleteTargetItem(null)}
                  disabled={deleteMenuMutation.isPending}
                >
                  {t("owner.keepItem", { defaultValue: "Keep item" })}
                </button>
                <button
                  type="button"
                  className="owner-button danger"
                  onClick={confirmDeleteMenuItem}
                  disabled={deleteMenuMutation.isPending}
                >
                  {deleteMenuMutation.isPending
                    ? t("owner.deleting", { defaultValue: "Deleting..." })
                    : t("owner.delete")}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    );
  }

  function renderProfilePanel() {
    return (
      <div className="owner-settings-layout">
        <section className="owner-section-card">
          <div className="owner-section-head">
            <div>
              <p className="owner-section-kicker">
                {t("owner.sections.profileKicker")}
              </p>
              <h2>{t("owner.shopInfoTitle")}</h2>
              <p>{t("owner.sections.profileDescription")}</p>
            </div>
          </div>

          <form className="owner-form" onSubmit={handleProfileSubmit}>
            <div className="owner-form-grid two">
              <FormInput
                label={t("owner.fields.shopName")}
                value={profileForm.shopName}
                onChange={(value) =>
                  setProfileForm((prev) => ({ ...prev, shopName: value }))
                }
              />
              <FormInput
                label={t("owner.fields.phone")}
                value={profileForm.phone}
                onChange={(value) =>
                  setProfileForm((prev) => ({ ...prev, phone: value }))
                }
              />
            </div>
            <FormInput
              label={t("owner.fields.address")}
              value={profileForm.addressLine}
              onChange={(value) =>
                setProfileForm((prev) => ({ ...prev, addressLine: value }))
              }
            />
            <OwnerMapPicker
              latitude={profileForm.latitude}
              longitude={profileForm.longitude}
              label={displayShopName || profileForm.shopName}
              onChange={({ latitude, longitude }) =>
                setProfileForm((prev) => ({
                  ...prev,
                  latitude,
                  longitude,
                }))
              }
            />
            <FormInput
              label={t("owner.fields.hours")}
              value={profileForm.openingHours}
              onChange={(value) =>
                setProfileForm((prev) => ({ ...prev, openingHours: value }))
              }
            />
            <FormInput
              label={t("owner.fields.imageUrl")}
              value={profileForm.imageUrl}
              onChange={(value) =>
                setProfileForm((prev) => ({ ...prev, imageUrl: value }))
              }
            />
            <FormTextArea
              label={t("owner.fields.description")}
              rows="3"
              value={profileForm.description}
              onChange={(value) =>
                setProfileForm((prev) => ({ ...prev, description: value }))
              }
            />
            <FormTextArea
              label={t("owner.fields.pendingIntro")}
              rows="5"
              value={profileForm.pendingIntroduction}
              onChange={(value) =>
                setProfileForm((prev) => ({
                  ...prev,
                  pendingIntroduction: value,
                }))
              }
            />
            <button
              type="submit"
              className="owner-button"
              disabled={profileMutation.isPending}
            >
              {profileMutation.isPending
                ? t("owner.saving")
                : t("owner.saveProfile")}
            </button>
          </form>
        </section>
      </div>
    );
  }

  function renderMapInfoPanel() {
    return (
      <div className="owner-settings-layout">
        <section className="owner-section-card">
          <div className="owner-section-head">
            <div>
              <p className="owner-section-kicker">
                {t("owner.sections.mapKicker")}
              </p>
              <h2>{t("owner.poiTitle")}</h2>
              <p>{t("owner.poiSubtitle")}</p>
            </div>
            <span
              className={`owner-status-pill owner-status-pill-${statusTone}`}
            >
              {activeStatusLabel}
            </span>
          </div>

          <form className="owner-form" onSubmit={handlePoiSubmit}>
            <FormSelect
              label={t("owner.fields.poiCategory")}
              value={poiForm.category}
              options={OWNER_POI_CATEGORY_OPTIONS.map((option) => ({
                ...option,
                label: translateOwnerCategory(t, option.value) || option.label,
              }))}
              onChange={(value) =>
                setPoiForm((prev) => ({ ...prev, category: value }))
              }
            />
            <div className="owner-language-card">
              <div className="owner-auto-translate-head">
                <div>
                  <p className="owner-section-kicker">
                    {t("owner.autoTranslate.kicker", {
                      defaultValue: "Auto translate",
                    })}
                  </p>
                  <h3>
                    {t("owner.autoTranslate.title", {
                      defaultValue: "Write in one language",
                    })}
                  </h3>
                  <p>
                    {t("owner.autoTranslate.description", {
                      defaultValue:
                        "The system will translate this content into the supported languages after saving.",
                    })}
                  </p>
                </div>
                <FormSelect
                  label={t("owner.fields.sourceLanguage", {
                    defaultValue: "Input language",
                  })}
                  value={poiForm.sourceLanguage}
                  options={OWNER_POI_LANGUAGES.map((language) => ({
                    value: language.id,
                    label: t(language.labelKey, { defaultValue: language.fallback }),
                  }))}
                  onChange={(value) =>
                    setPoiForm((prev) => ({
                      ...prev,
                      sourceLanguage: value,
                    }))
                  }
                />
              </div>

              <div className="owner-language-panel">
                <FormInput
                  label={t("owner.fields.poiSourceName", {
                    defaultValue: "Displayed name",
                  })}
                  value={poiForm.sourceName}
                  onChange={(value) =>
                    setPoiForm((prev) => ({ ...prev, sourceName: value }))
                  }
                />
                <FormTextArea
                  label={t("owner.fields.poiSourceDescription", {
                    defaultValue: "Displayed description",
                  })}
                  rows="6"
                  value={poiForm.sourceDescription}
                  onChange={(value) =>
                    setPoiForm((prev) => ({
                      ...prev,
                      sourceDescription: value,
                    }))
                  }
                />
              </div>
            </div>
            <button
              type="submit"
              className="owner-button"
              disabled={poiMutation.isPending}
            >
              {poiMutation.isPending ? t("owner.saving") : t("owner.savePoi")}
            </button>
          </form>
        </section>
      </div>
    );
  }

  function renderQrPanel() {
    return (
      <div className="owner-settings-layout">
        <section className="owner-section-card">
          {primaryPoiId ? (
            <div className="owner-qr-layout">
              <div className="owner-standee">
                <div className="owner-standee-brand">
                  <ShopImage src={coverImage} label={displayShopName} compact />
                  <div>
                    <span>DiDuDuaDi</span>
                    <strong>
                      {displayShopName || t("qr.poiFallbackName")}
                    </strong>
                  </div>
                </div>
                <div className="owner-standee-body">
                  <p className="owner-section-kicker">
                    {t("owner.qrStandeeKicker", {
                      defaultValue: "Digital menu",
                    })}
                  </p>
                  <h3>
                    {t("owner.qrStandeeTitle", {
                      defaultValue: "Scan to view the menu",
                    })}
                  </h3>
                  <p>{standeeSummaryText}</p>
                  <PoiQrCard
                    poiId={primaryPoiId}
                    poiName={displayPrimaryPoiNameVi || displayShopName}
                    compact
                    minimal
                  />
                </div>
              </div>
              <div className="owner-qr-aside">
                <p className="owner-section-kicker">{t("qr.kicker")}</p>
                <h3>{t("qr.title")}</h3>
                <p>
                  {t("qr.subtitle", {
                    name:
                      displayPrimaryPoiNameVi ||
                      displayShopName ||
                      t("qr.poiFallbackName"),
                  })}
                </p>
                <label className="owner-qr-link-box">
                  <span>{t("qr.detailLinkLabel")}</span>
                  <textarea readOnly rows="3" value={qrDetailUrl} />
                </label>
                <div className="owner-qr-actions">
                  <button
                    type="button"
                    className="owner-button"
                    onClick={handleCopyQrLink}
                  >
                    {copiedQrLink ? t("qr.copied") : t("qr.copy")}
                  </button>
                  <a
                    className="owner-button secondary"
                    href={qrDetailUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("qr.open")}
                  </a>
                  <button
                    type="button"
                    className="owner-button secondary owner-print-button"
                    onClick={handlePrintStandee}
                  >
                    <Printer size={18} aria-hidden="true" />
                    {t("owner.printStandee", {
                      defaultValue: "Print standee",
                    })}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="owner-empty-state">
              {t("owner.sections.qrMissingDescription")}
            </p>
          )}
        </section>
      </div>
    );
  }

  function renderActivePanel() {
    if (!dashboard) return null;
    if (activeSection === "menu") return renderMenuPanel();
    if (activeSection === "profile") return renderProfilePanel();
    if (activeSection === "mapInfo") return renderMapInfoPanel();
    if (activeSection === "qr") return renderQrPanel();
    return renderOverviewPanel();
  }

  if (dashboardQuery.isLoading) {
    return (
      <section className="owner-page">
        <Loading />
      </section>
    );
  }

  if (dashboardQuery.error) {
    return (
      <section className="owner-page">
        <p className="owner-error">
          {dashboardQuery.error.message || t("owner.error")}
        </p>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="owner-page">
        <p className="owner-error">{t("owner.noShop")}</p>
      </section>
    );
  }

  return (
    <section className="owner-page">
      <div className="owner-shell">
        <header className="owner-shop-header">
          <div className="owner-shop-header-identity">
            <ShopImage src={coverImage} label={displayShopName} compact />
            <div className="owner-shop-header-copy">
              {/* <p className="owner-kicker">{t("owner.badge")}</p> */}
              <h1>{displayShopName || t("owner.noShop")}</h1>
              <div className="owner-shop-header-meta">
                {primaryPoiCategoryLabel ? (
                  <span className="owner-shop-meta">
                    {primaryPoiCategoryLabel}
                  </span>
                ) : null}
                <span
                  className={`owner-status-pill owner-status-pill-${statusTone}`}
                >
                  {activeStatusLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="owner-shop-header-actions" aria-label={t("owner.header.toolsAria")}>
            <button
              type="button"
              className={`owner-open-state${isShopOpen ? " active" : ""}`}
              aria-pressed={isShopOpen}
              disabled={openStatusMutation.isPending}
              onClick={handleToggleShopOpen}
              title={shopOpenLabel}
            >
              <span aria-hidden="true" />
              {shopOpenLabel}
            </button>
            <button
              type="button"
              className={`owner-notification-button${
                hasUnreadNotifications ? " has-unread" : ""
              }`}
              aria-expanded={isNotificationOpen}
              aria-label={t("owner.header.notificationsAria")}
              onClick={handleToggleNotifications}
            >
              <Bell size={21} strokeWidth={1.9} />
              {hasUnreadNotifications ? <span aria-hidden="true" /> : null}
            </button>
            {isNotificationOpen ? (
              <div className="owner-notification-popover" role="status">
                <div className="owner-notification-head">
                  <strong>{t("owner.notifications.title")}</strong>
                  <small>{t("owner.notifications.count", { count: notificationItems.length })}</small>
                </div>
                <div className="owner-notification-list">
                  {notificationItems.map((item) => (
                    <div className="owner-notification-item" key={item.id}>
                      <span aria-hidden="true" />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div className="owner-workspace">
          <aside className="owner-sidebar">
            <nav className="owner-nav">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`owner-nav-button${activeSection === section.id ? " active" : ""}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="owner-nav-index" aria-hidden="true">
                    <OwnerSectionIcon type={section.icon} />
                  </span>
                  <span className="owner-nav-copy">
                    <strong>{section.label}</strong>
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="owner-main">
            {feedback ? (
              <div className="owner-feedback owner-toast" role="status">
                <CheckCircle2 size={19} aria-hidden="true" />
                <span>{feedback}</span>
              </div>
            ) : null}
            {mutationError ? (
              <div className="owner-error owner-inline-error">
                {mutationError}
              </div>
            ) : null}

            <div className="owner-stage">{renderActivePanel()}</div>
          </main>
        </div>
      </div>
    </section>
  );
}

function FormInput({ label, onChange, ...inputProps }) {
  return (
    <label className="owner-field">
      <span>{label}</span>
      <input
        {...inputProps}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function FormSelect({ label, options, onChange, ...selectProps }) {
  return (
    <label className="owner-field">
      <span>{label}</span>
      <select
        {...selectProps}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormTextArea({ label, onChange, ...textareaProps }) {
  return (
    <label className="owner-field">
      <span>{label}</span>
      <textarea
        {...textareaProps}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MetricCard({
  icon: Icon = BarChart3,
  label,
  value,
  hint,
  data = [],
  tone = "emerald",
}) {
  return (
    <article className={`owner-metric-card owner-metric-card-${tone}`}>
      <div className="owner-metric-top">
        <span className="owner-metric-icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <strong>{value}</strong>
      </div>
      <span>{label}</span>
      {hint ? <small>{hint}</small> : null}
      {data.length ? (
        <div className="owner-sparkline" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 6, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id={`ownerSparkline-${tone}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="currentColor"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="currentColor"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                strokeWidth={2.4}
                fill={`url(#ownerSparkline-${tone})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </article>
  );
}

function OwnerSectionIcon({ type }) {
  const icons = {
    overview: LayoutDashboard,
    menu: Utensils,
    profile: Store,
    map: MapPin,
    qr: QrCode,
  };
  const Icon = icons[type] || LayoutDashboard;
  return <Icon size={19} strokeWidth={1.8} />;
}

function ShopImage({ src, label, compact = false }) {
  return (
    <div className={`owner-shop-image${compact ? " compact" : ""}`}>
      {src ? (
        <img src={src} alt={label || "shop"} />
      ) : (
        <div className="owner-image-fallback">{buildInitials(label)}</div>
      )}
    </div>
  );
}

function DishMenuGrid({ items, emptyText, onEdit, onDelete, onToggle, t }) {
  if (!items.length) {
    return <p className="owner-empty-state">{emptyText}</p>;
  }

  return (
    <div className="owner-dish-grid">
      {items.map((item) => (
        <article key={item.id} className="owner-dish-card">
          <div className="owner-dish-image">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} />
            ) : (
              <div className="owner-image-fallback">
                {buildInitials(item.name)}
              </div>
            )}
          </div>
          <div className="owner-dish-body">
            <div className="owner-dish-title-row">
              <strong>{getFriendlyDisplayName(item.name)}</strong>
              <span>{formatCurrency(item.price)}</span>
            </div>
          </div>
          <div className="owner-dish-actions">
            <button
              type="button"
              className={`owner-stock-toggle${item.isAvailable ? " active" : ""}`}
              onClick={() => onToggle(item)}
            >
              {item.isAvailable ? t("owner.available") : t("owner.hidden")}
            </button>
            <button
              type="button"
              className="owner-link-button"
              onClick={() => onEdit(item)}
            >
              <Pencil size={15} aria-hidden="true" />
              {t("owner.edit")}
            </button>
            {onDelete ? (
              <button
                type="button"
                className="owner-link-button danger"
                onClick={() => onDelete(item)}
              >
                <Trash2 size={15} aria-hidden="true" />
                {t("owner.delete")}
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function DishPreviewCard({ item, t }) {
  const name =
    getFriendlyDisplayName(item.name) ||
    t("owner.preview.emptyMenuName", {
      defaultValue: "Dish name appears here",
    });
  const description =
    item.description ||
    t("owner.preview.emptyMenuDescription", {
      defaultValue: "Add a short description so visitors understand the dish before choosing.",
    });

  const imageValidationMessage = getMenuImageUrlValidationMessage(
    item.imageUrl,
    t,
  );

  return (
    <article
      className={`owner-menu-preview-card${item.isAvailable ? "" : " is-hidden"}`}
    >
      <div className="owner-menu-preview-image">
        {item.imageUrl && !imageValidationMessage ? (
          <img src={item.imageUrl} alt={name} />
        ) : (
          <div className="owner-image-fallback">{buildInitials(name)}</div>
        )}
      </div>
      <div className="owner-menu-preview-body">
        <div>
          <strong>{name}</strong>
          <span>{formatCurrency(item.price)}</span>
        </div>
        <p>{description}</p>
        <small>
          {item.isAvailable
            ? t("owner.available")
            : t("owner.hidden")}
        </small>
        {imageValidationMessage ? (
          <em>{imageValidationMessage}</em>
        ) : null}
      </div>
    </article>
  );
}

function OwnerMapPicker({ latitude, longitude, label, onChange }) {
  const selectedPosition = parseOwnerCoordinates(latitude, longitude);
  const center = selectedPosition || DEFAULT_OWNER_MAP_CENTER;

  return (
    <div className="owner-map-picker">
      <div className="owner-map-picker-head">
        <div>
          <span className="owner-field-caption">GPS</span>
          <strong>Chon vi tri quan tren ban do</strong>
        </div>
        <span className="owner-coordinate-pill">
          <Navigation size={15} aria-hidden="true" />
          {selectedPosition
            ? `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}`
            : "10.758700, 106.703100"}
        </span>
      </div>
      <div className="owner-map-canvas">
        <MapContainer
          center={center}
          zoom={17}
          scrollWheelZoom
          className="owner-leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <OwnerMapSync center={center} />
          <OwnerMapClickLayer onChange={onChange} />
          {selectedPosition ? (
            <CircleMarker
              center={selectedPosition}
              radius={12}
              pathOptions={{
                color: "#047857",
                fillColor: "#10B981",
                fillOpacity: 0.9,
                weight: 3,
              }}
            />
          ) : null}
        </MapContainer>
      </div>
      <p className="owner-map-help">
        Bam truc tiep vao vi tri cua {label || "quan"} tren ban do de cap nhat
        toa do GPS.
      </p>
    </div>
  );
}

function OwnerMapSync({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function OwnerMapClickLayer({ onChange }) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat.toFixed(6),
        longitude: event.latlng.lng.toFixed(6),
      });
    },
  });

  return null;
}

function buildMenuPayload(item) {
  return {
    name: item.name || "",
    description: item.description || "",
    price: Number(item.price || 0),
    imageUrl: item.imageUrl || "",
    isAvailable: Boolean(item.isAvailable),
    displayOrder: Number(item.displayOrder || 0),
  };
}

function buildSparklineData(totalValue = 0, todayValue = 0) {
  const total = Number(totalValue || 0);
  const today = Number(todayValue || 0);
  const base = Math.max(total - today, 0);

  return [
    { value: Math.max(Math.round(total * 0.45), 0) },
    { value: Math.max(Math.round(total * 0.58), 1) },
    { value: Math.max(Math.round(total * 0.7), 1) },
    { value: Math.max(base, 1) },
    { value: Math.max(total, today, 1) },
  ];
}

function parseOwnerCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
}

function getOwnerStatusTone(status) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";
  return "neutral";
}

function translateOwnerStatus(t, status) {
  if (status === "approved") return t("owner.status.approved");
  if (status === "rejected") return t("owner.status.rejected");
  if (status === "pending") return t("owner.status.pending");
  return t("owner.status.notSubmitted");
}

function getFriendlyDisplayName(value = "") {
  return value
    .replace(/\bdemo\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getFriendlyOwnerSummary(value, fallback) {
  const normalized = (value || "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return fallback;
  }

  if (isOwnerSummaryPlaceholder(normalized)) {
    return fallback;
  }

  return normalized;
}

function isOwnerSummaryPlaceholder(value) {
  return /demo|test|placeholder|POI|dashboard|feature|add a short introduction|complete.*profile|fill in.*shop|th[eê]m.*gi[oơ]i thi[eệ]u|ho[aà]n thi[eệ]n.*h[oồ] s[oơ]|店舗情報|完全なプロフィール|店铺信息|完整.*资料|가게 정보|전체 프로필|กรอกข้อมูลร้าน|โปรไฟล์ครบถ้วน/i.test(
    value,
  );
}

function getMenuImageUrlValidationMessage(value, t) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return "";

  if (/^data:image\//i.test(imageUrl)) {
    return t("owner.validation.imageDataUrl", {
      defaultValue:
        "Image only accepts a public image link, not pasted/base64 image data.",
    });
  }

  if (imageUrl.length > MAX_MENU_IMAGE_URL_LENGTH) {
    return t("owner.validation.imageUrlTooLong", {
      defaultValue: "Image URL is too long. Please use a link under 500 characters.",
    });
  }

  return "";
}

function getMutationErrorMessage(error, t) {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message;

  if (serverMessage) {
    return t("owner.feedback.errorWithDetail", {
      defaultValue: "Could not save changes: {{message}}",
      message: serverMessage,
    });
  }

  return t("owner.feedback.error", {
    defaultValue:
      "Could not save changes. Check your connection or try again.",
  });
}

function translateOwnerCategory(t, value) {
  const normalized = (value || "").toLowerCase();
  const lookup = {
    food: "owner.categories.food",
    street_food: "owner.categories.street_food",
    grilled_food: "owner.categories.grilled_food",
    dessert: "owner.categories.dessert",
    seafood: "owner.categories.seafood",
    snack: "owner.categories.snack",
    drinks: "owner.categories.drinks",
  };

  return lookup[normalized] ? t(lookup[normalized]) : value || "";
}

function buildInitials(value = "") {
  return (
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VK"
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
