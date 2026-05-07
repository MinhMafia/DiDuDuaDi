import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  BarChart3,
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
  { id: "vi", label: "Tieng Viet" },
  { id: "en", label: "English" },
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

const EMPTY_POI_FORM = {
  category: "food",
  nameVi: "",
  descriptionVi: "",
  nameEn: "",
  descriptionEn: "",
};

export default function OwnerDashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);
  const [activeSection, setActiveSection] = useState("overview");
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_ITEM);
  const [poiForm, setPoiForm] = useState(EMPTY_POI_FORM);
  const [activePoiLanguage, setActivePoiLanguage] = useState("vi");
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);

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
      nameVi: dashboardQuery.data.primaryPoi?.nameVi || "",
      descriptionVi: dashboardQuery.data.primaryPoi?.descriptionVi || "",
      nameEn: dashboardQuery.data.primaryPoi?.nameEn || "",
      descriptionEn: dashboardQuery.data.primaryPoi?.descriptionEn || "",
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
      await invalidateDashboard();
    },
  });

  const createMenuMutation = useMutation({
    mutationFn: (payload) => createMenuItem(payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuCreated"));
      setMenuForm(EMPTY_MENU_ITEM);
      setEditingMenuItemId(null);
      setIsMenuDialogOpen(false);
      await invalidateDashboard();
    },
  });

  const updateMenuMutation = useMutation({
    mutationFn: ({ menuItemId, payload }) =>
      updateMenuItem(menuItemId, payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuUpdated"));
      setMenuForm(EMPTY_MENU_ITEM);
      setEditingMenuItemId(null);
      setIsMenuDialogOpen(false);
      await invalidateDashboard();
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (menuItemId) => deleteMenuItem(menuItemId),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuDeleted"));
      await invalidateDashboard();
    },
  });

  const poiMutation = useMutation({
    mutationFn: (payload) => updatePoiContent(payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.poiSaved"));
      await invalidateDashboard();
    },
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
  const coverImage =
    dashboard?.imageUrl ||
    menuItems.find((item) => item.imageUrl)?.imageUrl ||
    "";
  const qrDetailUrl = primaryPoiId
    ? buildPoiDetailUrl(primaryPoiId, getInitialPublicBaseUrl())
    : "";

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
    poiMutation.mutate(poiForm);
  }

  function handleMenuSubmit(event) {
    event.preventDefault();
    setFeedback("");

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
    updateMenuMutation.mutate({
      menuItemId: item.id,
      payload: buildMenuPayload({
        ...item,
        isAvailable: !item.isAvailable,
      }),
    });
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
            onDelete={(id) => deleteMenuMutation.mutate(id)}
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
                  <p>{t("owner.menuSubtitle")}</p>
                </div>
                <button
                  type="button"
                  className="owner-dialog-close"
                  onClick={closeMenuDialog}
                  aria-label={t("owner.cancelEdit")}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <form className="owner-form" onSubmit={handleMenuSubmit}>
                <div className="owner-form-grid two">
                  <FormInput
                    label={t("owner.fields.menuName")}
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
                    value={menuForm.price}
                    onChange={(value) =>
                      setMenuForm((prev) => ({ ...prev, price: value }))
                    }
                  />
                </div>

                <FormTextArea
                  label={t("owner.fields.menuDescription")}
                  rows="3"
                  value={menuForm.description}
                  onChange={(value) =>
                    setMenuForm((prev) => ({ ...prev, description: value }))
                  }
                />

                <div className="owner-form-grid two">
                  <FormInput
                    label={t("owner.fields.imageUrl")}
                    value={menuForm.imageUrl}
                    onChange={(value) =>
                      setMenuForm((prev) => ({ ...prev, imageUrl: value }))
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

                <label className="owner-switch-line">
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
                </label>

                <div className="owner-action-row">
                  <button
                    type="submit"
                    className="owner-button"
                    disabled={
                      createMenuMutation.isPending ||
                      updateMenuMutation.isPending
                    }
                  >
                    {editingMenuItemId
                      ? t("owner.updateMenu")
                      : t("owner.addMenu")}
                  </button>
                  <button
                    type="button"
                    className="owner-button secondary"
                    onClick={closeMenuDialog}
                  >
                    {t("owner.cancelEdit")}
                  </button>
                </div>
              </form>
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
            <FormInput
              label={t("owner.fields.poiCategory")}
              value={poiForm.category}
              onChange={(value) =>
                setPoiForm((prev) => ({ ...prev, category: value }))
              }
            />
            <div className="owner-language-card">
              <div
                className="owner-language-tabs"
                role="tablist"
                aria-label="POI languages"
              >
                {OWNER_POI_LANGUAGES.map((language) => (
                  <button
                    key={language.id}
                    type="button"
                    className={
                      activePoiLanguage === language.id ? "active" : ""
                    }
                    onClick={() => setActivePoiLanguage(language.id)}
                  >
                    <Languages size={16} aria-hidden="true" />
                    {language.label}
                  </button>
                ))}
              </div>

              {activePoiLanguage === "vi" ? (
                <div className="owner-language-panel">
                  <FormInput
                    label={t("owner.fields.poiNameVi")}
                    value={poiForm.nameVi}
                    onChange={(value) =>
                      setPoiForm((prev) => ({ ...prev, nameVi: value }))
                    }
                  />
                  <FormTextArea
                    label={t("owner.fields.poiDescriptionVi")}
                    rows="6"
                    value={poiForm.descriptionVi}
                    onChange={(value) =>
                      setPoiForm((prev) => ({ ...prev, descriptionVi: value }))
                    }
                  />
                </div>
              ) : (
                <div className="owner-language-panel">
                  <FormInput
                    label={t("owner.fields.poiNameEn")}
                    value={poiForm.nameEn}
                    onChange={(value) =>
                      setPoiForm((prev) => ({ ...prev, nameEn: value }))
                    }
                  />
                  <FormTextArea
                    label={t("owner.fields.poiDescriptionEn")}
                    rows="6"
                    value={poiForm.descriptionEn}
                    onChange={(value) =>
                      setPoiForm((prev) => ({ ...prev, descriptionEn: value }))
                    }
                  />
                </div>
              )}
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
                  <p className="owner-section-kicker">Digital menu</p>
                  <h3>Quet ma de xem thuc don</h3>
                  <p>{heroSummaryText}</p>
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
                    In standee
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
          <ShopImage src={coverImage} label={displayShopName} compact />
          <div className="owner-shop-header-copy">
            {/* <p className="owner-kicker">{t("owner.badge")}</p> */}
            <h1>{displayShopName || t("owner.noShop")}</h1>
            <p>{heroSummaryText}</p>
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
                    <small>{section.description}</small>
                  </span>
                  <span className="owner-nav-badge">{section.badge}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="owner-main">
            {feedback ? <div className="owner-feedback">{feedback}</div> : null}

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
                onClick={() => onDelete(item.id)}
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

  if (/(demo|test|placeholder|POI|dashboard|tính năng)/i.test(normalized)) {
    return fallback;
  }

  return normalized;
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
