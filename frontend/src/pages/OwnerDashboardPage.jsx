import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Loading from "../components/common/Loading";
import PoiQrCard from "../components/common/PoiQrCard";
import {
  createClaimCode,
  createMenuItem,
  deleteMenuItem,
  getOwnerDashboard,
  updateMenuItem,
  updatePoiContent,
  updateShopProfile,
} from "../services/ownerService";
import "./OwnerDashboardPage.css";

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

const EMPTY_CLAIM_CODE = {
  amount: "",
  note: "",
  expireAfterHours: 24,
};

export default function OwnerDashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);
  const [activeSection, setActiveSection] = useState("overview");
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_ITEM);
  const [poiForm, setPoiForm] = useState(EMPTY_POI_FORM);
  const [claimCodeForm, setClaimCodeForm] = useState(EMPTY_CLAIM_CODE);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [feedback, setFeedback] = useState("");

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
    queryClient.invalidateQueries({ queryKey: ["owner-dashboard", currentUser?.username] });

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
      await invalidateDashboard();
    },
  });

  const updateMenuMutation = useMutation({
    mutationFn: ({ menuItemId, payload }) => updateMenuItem(menuItemId, payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuUpdated"));
      setMenuForm(EMPTY_MENU_ITEM);
      setEditingMenuItemId(null);
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

  const claimCodeMutation = useMutation({
    mutationFn: (payload) => createClaimCode(payload),
    onSuccess: async (response) => {
      const code = response.data?.code ? ` (${response.data.code})` : "";
      setFeedback(`${response.message || t("owner.feedback.claimCreated")}${code}`);
      setClaimCodeForm(EMPTY_CLAIM_CODE);
      await invalidateDashboard();
    },
  });

  const dashboard = dashboardQuery.data;
  const menuItems = dashboard?.menuItems ?? [];
  const claimCodes = dashboard?.recentClaimCodes ?? [];
  const stats = dashboard?.stats;
  const primaryPoi = dashboard?.primaryPoi;
  const primaryPoiId = primaryPoi?.poiId || primaryPoi?.id || "";
  const statusTone = getOwnerStatusTone(dashboard?.introReviewStatus);
  const activeStatusLabel = translateOwnerStatus(t, dashboard?.introReviewStatus);
  const displayShopName = getFriendlyDisplayName(dashboard?.shopName || "");
  const displayPrimaryPoiNameVi = getFriendlyDisplayName(primaryPoi?.nameVi || "");
  const primaryPoiCategoryLabel = translateOwnerCategory(t, primaryPoi?.category);
  const availableMenuCount = menuItems.filter((item) => item.isAvailable).length;
  const todayClaimCodesCount = countTodayClaims(claimCodes);
  const latestClaimCode = claimCodes[0];
  const heroSummaryText = getFriendlyOwnerSummary(
    dashboard?.approvedIntroduction ||
      dashboard?.pendingIntroduction ||
      dashboard?.description,
    t("owner.summaryFallback"),
  );
  const coverImage =
    dashboard?.imageUrl || menuItems.find((item) => item.imageUrl)?.imageUrl || "";

  const sections = [
    {
      id: "overview",
      label: t("owner.sections.overview"),
      description: t("owner.sections.overviewDescription"),
      badge: activeStatusLabel,
      icon: "01",
    },
    {
      id: "menu",
      label: t("owner.menuTitle"),
      description: t("owner.menuSubtitle"),
      badge: `${availableMenuCount}/${menuItems.length}`,
      icon: "02",
    },
    {
      id: "claims",
      label: t("owner.claimTitle"),
      description: t("owner.claimSubtitle"),
      badge: String(todayClaimCodesCount),
      icon: "03",
    },
    {
      id: "settings",
      label: t("owner.settingsTitle", "Cài đặt quán"),
      description: t("owner.settingsSubtitle", "Cập nhật hồ sơ và thông tin hiển thị trên bản đồ."),
      badge: displayShopName || "--",
      icon: "04",
    },
  ];
  const activeSectionConfig =
    sections.find((section) => section.id === activeSection) || sections[0];

  function handleProfileSubmit(event) {
    event.preventDefault();
    setFeedback("");
    profileMutation.mutate({
      ...profileForm,
      latitude: profileForm.latitude === "" ? null : Number(profileForm.latitude),
      longitude: profileForm.longitude === "" ? null : Number(profileForm.longitude),
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

  function handleClaimSubmit(event) {
    event.preventDefault();
    setFeedback("");
    claimCodeMutation.mutate({
      ...claimCodeForm,
      amount: Number(claimCodeForm.amount || 0),
      expireAfterHours: Number(claimCodeForm.expireAfterHours || 24),
    });
  }

  function startEditMenuItem(item) {
    setEditingMenuItemId(item.id);
    setActiveSection("menu");
    setMenuForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      imageUrl: item.imageUrl || "",
      isAvailable: Boolean(item.isAvailable),
      displayOrder: item.displayOrder || 0,
    });
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

  function renderOverviewPanel() {
    return (
      <div className="owner-overview">
        <div className="owner-metrics-row">
          <MetricCard label={t("owner.labels.menuCount")} value={availableMenuCount} hint={`${menuItems.length} ${t("owner.menuTitle").toLowerCase()}`} />
          <MetricCard label={t("owner.stats.claimCodes")} value={todayClaimCodesCount} hint={t("owner.today", "Hôm nay")} />
          <MetricCard label={t("owner.stats.totalVisits")} value={stats?.totalVisitCount ?? 0} hint={t("owner.stats.todayVisits") + `: ${stats?.visitCountToday ?? 0}`} />
          <MetricCard label={t("owner.stats.audioPlays")} value={stats?.totalAudioPlayCount ?? 0} hint={t("owner.stats.todayAudio") + `: ${stats?.audioPlayCountToday ?? 0}`} />
        </div>

        <div className="owner-overview-grid">
          <section className="owner-section-card owner-shop-spotlight">
            <div className="owner-spotlight-copy">
              <span className={`owner-status-pill owner-status-pill-${statusTone}`}>
                {activeStatusLabel}
              </span>
              <p className="owner-section-kicker">{t("owner.shopInfoTitle")}</p>
              <h2>{displayShopName || t("owner.noShop")}</h2>
              <p>{heroSummaryText}</p>
              <div className="owner-action-row">
                <button type="button" className="owner-button" onClick={() => setActiveSection("settings")}>
                  {t("owner.edit")}
                </button>
                <Link className="owner-button secondary" to="/map">
                  {t("owner.viewMap")}
                </Link>
              </div>
            </div>
            <ShopImage src={coverImage} label={displayShopName} />
          </section>

          <section className="owner-section-card owner-fast-payment">
            <p className="owner-section-kicker">{t("owner.sections.claimKicker")}</p>
            <h2>{t("owner.quickPayment", "Tạo mã nhanh")}</h2>
            <p>{t("owner.quickPaymentHint", "Nhập số tiền, tạo mã và đọc ngay cho khách tại quầy.")}</p>
            <QuickClaimForm
              claimCodeForm={claimCodeForm}
              isPending={claimCodeMutation.isPending}
              onChange={setClaimCodeForm}
              onSubmit={handleClaimSubmit}
              t={t}
            />
            {latestClaimCode ? (
              <div className="owner-latest-code">
                <span>{t("owner.latestCode", "Mã gần nhất")}</span>
                <strong>{latestClaimCode.code}</strong>
              </div>
            ) : null}
          </section>
        </div>

        <section className="owner-section-card">
          <div className="owner-section-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.menuListKicker")}</p>
              <h2>{t("owner.sections.menuList")}</h2>
            </div>
            <button type="button" className="owner-button secondary" onClick={() => setActiveSection("menu")}>
              {t("owner.addMenu")}
            </button>
          </div>
          <CompactMenuList
            items={menuItems.slice(0, 5)}
            emptyText={t("owner.empty.menu")}
            onEdit={startEditMenuItem}
            onToggle={handleToggleMenuAvailability}
            t={t}
            compact
          />
        </section>
      </div>
    );
  }

  function renderMenuPanel() {
    return (
      <div className="owner-menu-layout">
        <section className="owner-section-card owner-menu-editor">
          <div className="owner-section-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.menuKicker")}</p>
              <h2>{editingMenuItemId ? t("owner.sections.editMenu") : t("owner.addMenu")}</h2>
              <p>{t("owner.menuSubtitle")}</p>
            </div>
          </div>

          <form className="owner-form" onSubmit={handleMenuSubmit}>
            <div className="owner-form-grid two">
              <FormInput
                label={t("owner.fields.menuName")}
                value={menuForm.name}
                onChange={(value) => setMenuForm((prev) => ({ ...prev, name: value }))}
              />
              <FormInput
                label={t("owner.fields.price")}
                type="number"
                min="0"
                step="1000"
                value={menuForm.price}
                onChange={(value) => setMenuForm((prev) => ({ ...prev, price: value }))}
              />
            </div>

            <FormTextArea
              label={t("owner.fields.menuDescription")}
              rows="3"
              value={menuForm.description}
              onChange={(value) => setMenuForm((prev) => ({ ...prev, description: value }))}
            />

            <div className="owner-form-grid two">
              <FormInput
                label={t("owner.fields.imageUrl")}
                value={menuForm.imageUrl}
                onChange={(value) => setMenuForm((prev) => ({ ...prev, imageUrl: value }))}
              />
              <FormInput
                label={t("owner.fields.order")}
                type="number"
                min="0"
                value={menuForm.displayOrder}
                onChange={(value) => setMenuForm((prev) => ({ ...prev, displayOrder: value }))}
              />
            </div>

            <label className="owner-switch-line">
              <input
                type="checkbox"
                checked={menuForm.isAvailable}
                onChange={(event) =>
                  setMenuForm((prev) => ({ ...prev, isAvailable: event.target.checked }))
                }
              />
              <span>{t("owner.fields.available")}</span>
            </label>

            <div className="owner-action-row">
              <button
                type="submit"
                className="owner-button"
                disabled={createMenuMutation.isPending || updateMenuMutation.isPending}
              >
                {editingMenuItemId ? t("owner.updateMenu") : t("owner.addMenu")}
              </button>
              {editingMenuItemId ? (
                <button
                  type="button"
                  className="owner-button secondary"
                  onClick={() => {
                    setEditingMenuItemId(null);
                    setMenuForm(EMPTY_MENU_ITEM);
                  }}
                >
                  {t("owner.cancelEdit")}
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="owner-section-card">
          <div className="owner-section-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.menuListKicker")}</p>
              <h2>{t("owner.sections.menuList")}</h2>
              <p>{t("owner.sections.menuListDescription")}</p>
            </div>
            <span className="owner-count-pill">{availableMenuCount}/{menuItems.length}</span>
          </div>
          <CompactMenuList
            items={menuItems}
            emptyText={t("owner.empty.menu")}
            onEdit={startEditMenuItem}
            onDelete={(id) => deleteMenuMutation.mutate(id)}
            onToggle={handleToggleMenuAvailability}
            t={t}
          />
        </section>
      </div>
    );
  }

  function renderClaimsPanel() {
    return (
      <div className="owner-payment-layout">
        <section className="owner-section-card owner-payment-maker">
          <p className="owner-section-kicker">{t("owner.sections.claimKicker")}</p>
          <h2>{t("owner.claimTitle")}</h2>
          <p>{t("owner.claimSubtitle")}</p>
          <QuickClaimForm
            claimCodeForm={claimCodeForm}
            isPending={claimCodeMutation.isPending}
            onChange={setClaimCodeForm}
            onSubmit={handleClaimSubmit}
            t={t}
            large
          />
        </section>

        <section className="owner-section-card">
          <div className="owner-section-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.claimHistoryKicker")}</p>
              <h2>{t("owner.sections.claimHistory")}</h2>
              <p>{t("owner.sections.claimHistoryDescription")}</p>
            </div>
            <span className="owner-count-pill">{claimCodes.length}</span>
          </div>
          <ClaimCodeList claimCodes={claimCodes} emptyText={t("owner.empty.claims")} t={t} />
        </section>
      </div>
    );
  }

  function renderSettingsPanel() {
    return (
      <div className="owner-settings-layout">
        <section className="owner-section-card">
          <div className="owner-section-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.profileKicker")}</p>
              <h2>{t("owner.shopInfoTitle")}</h2>
              <p>{t("owner.sections.profileDescription")}</p>
            </div>
          </div>

          <form className="owner-form" onSubmit={handleProfileSubmit}>
            <div className="owner-form-grid two">
              <FormInput label={t("owner.fields.shopName")} value={profileForm.shopName} onChange={(value) => setProfileForm((prev) => ({ ...prev, shopName: value }))} />
              <FormInput label={t("owner.fields.phone")} value={profileForm.phone} onChange={(value) => setProfileForm((prev) => ({ ...prev, phone: value }))} />
            </div>
            <FormInput label={t("owner.fields.address")} value={profileForm.addressLine} onChange={(value) => setProfileForm((prev) => ({ ...prev, addressLine: value }))} />
            <div className="owner-form-grid three">
              <FormInput label={t("owner.fields.latitude")} type="number" step="0.000001" value={profileForm.latitude} onChange={(value) => setProfileForm((prev) => ({ ...prev, latitude: value }))} />
              <FormInput label={t("owner.fields.longitude")} type="number" step="0.000001" value={profileForm.longitude} onChange={(value) => setProfileForm((prev) => ({ ...prev, longitude: value }))} />
              <FormInput label={t("owner.fields.hours")} value={profileForm.openingHours} onChange={(value) => setProfileForm((prev) => ({ ...prev, openingHours: value }))} />
            </div>
            <FormInput label={t("owner.fields.imageUrl")} value={profileForm.imageUrl} onChange={(value) => setProfileForm((prev) => ({ ...prev, imageUrl: value }))} />
            <FormTextArea label={t("owner.fields.description")} rows="3" value={profileForm.description} onChange={(value) => setProfileForm((prev) => ({ ...prev, description: value }))} />
            <FormTextArea label={t("owner.fields.pendingIntro")} rows="5" value={profileForm.pendingIntroduction} onChange={(value) => setProfileForm((prev) => ({ ...prev, pendingIntroduction: value }))} />
            <button type="submit" className="owner-button" disabled={profileMutation.isPending}>
              {profileMutation.isPending ? t("owner.saving") : t("owner.saveProfile")}
            </button>
          </form>
        </section>

        <section className="owner-section-card">
          <div className="owner-section-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.mapKicker")}</p>
              <h2>{t("owner.poiTitle")}</h2>
              <p>{t("owner.poiSubtitle")}</p>
            </div>
            <span className={`owner-status-pill owner-status-pill-${statusTone}`}>{activeStatusLabel}</span>
          </div>

          <form className="owner-form" onSubmit={handlePoiSubmit}>
            <FormInput label={t("owner.fields.poiCategory")} value={poiForm.category} onChange={(value) => setPoiForm((prev) => ({ ...prev, category: value }))} />
            <div className="owner-form-grid two">
              <FormInput label={t("owner.fields.poiNameVi")} value={poiForm.nameVi} onChange={(value) => setPoiForm((prev) => ({ ...prev, nameVi: value }))} />
              <FormInput label={t("owner.fields.poiNameEn")} value={poiForm.nameEn} onChange={(value) => setPoiForm((prev) => ({ ...prev, nameEn: value }))} />
            </div>
            <div className="owner-form-grid two">
              <FormTextArea label={t("owner.fields.poiDescriptionVi")} rows="5" value={poiForm.descriptionVi} onChange={(value) => setPoiForm((prev) => ({ ...prev, descriptionVi: value }))} />
              <FormTextArea label={t("owner.fields.poiDescriptionEn")} rows="5" value={poiForm.descriptionEn} onChange={(value) => setPoiForm((prev) => ({ ...prev, descriptionEn: value }))} />
            </div>
            <button type="submit" className="owner-button" disabled={poiMutation.isPending}>
              {poiMutation.isPending ? t("owner.saving") : t("owner.savePoi")}
            </button>
          </form>

          {primaryPoiId ? (
            <div className="owner-qr-inline">
              <PoiQrCard poiId={primaryPoiId} poiName={displayPrimaryPoiNameVi || displayShopName} compact />
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  function renderActivePanel() {
    if (!dashboard) return null;
    if (activeSection === "menu") return renderMenuPanel();
    if (activeSection === "claims") return renderClaimsPanel();
    if (activeSection === "settings") return renderSettingsPanel();
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
        <p className="owner-error">{dashboardQuery.error.message || t("owner.error")}</p>
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
        <aside className="owner-sidebar">
          <div className="owner-brand-card">
            <ShopImage src={coverImage} label={displayShopName} compact />
            <div>
              <p className="owner-kicker">{t("owner.badge")}</p>
              <h1>{displayShopName || t("owner.noShop")}</h1>
              {primaryPoiCategoryLabel ? <span className="owner-shop-meta">{primaryPoiCategoryLabel}</span> : null}
              <span className={`owner-status-pill owner-status-pill-${statusTone}`}>
                {activeStatusLabel}
              </span>
            </div>
          </div>

          <nav className="owner-nav">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`owner-nav-button${activeSection === section.id ? " active" : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="owner-nav-index">{section.icon}</span>
                <span className="owner-nav-copy">
                  <strong>{section.label}</strong>
                  <small>{section.description}</small>
                </span>
                <span className="owner-nav-badge">{section.badge}</span>
              </button>
            ))}
          </nav>

          <Link className="owner-button owner-sidebar-map" to="/map">
            {t("owner.viewMap")}
          </Link>
        </aside>

        <main className="owner-main">
          <header className="owner-main-header">
            <div>
              <p className="owner-section-kicker">{t("owner.badge")}</p>
              <h2>{activeSectionConfig.label}</h2>
              <p>{activeSectionConfig.description}</p>
            </div>
            <div className="owner-header-actions">
              <span className="owner-content-tag">{activeSectionConfig.badge}</span>
              {activeSection !== "claims" ? (
                <button type="button" className="owner-button secondary" onClick={() => setActiveSection("claims")}>
                  {t("owner.createClaim")}
                </button>
              ) : null}
            </div>
          </header>

          {feedback ? <div className="owner-feedback">{feedback}</div> : null}

          <div className="owner-stage">{renderActivePanel()}</div>
        </main>
      </div>
    </section>
  );
}

function FormInput({ label, onChange, ...inputProps }) {
  return (
    <label className="owner-field">
      <span>{label}</span>
      <input {...inputProps} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function FormTextArea({ label, onChange, ...textareaProps }) {
  return (
    <label className="owner-field">
      <span>{label}</span>
      <textarea {...textareaProps} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <article className="owner-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
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

function QuickClaimForm({ claimCodeForm, isPending, onChange, onSubmit, t, large = false }) {
  return (
    <form className={`owner-quick-claim${large ? " large" : ""}`} onSubmit={onSubmit}>
      <div className="owner-form-grid two">
        <FormInput
          label={t("owner.fields.amount")}
          type="number"
          min="0"
          step="1000"
          value={claimCodeForm.amount}
          onChange={(value) => onChange((prev) => ({ ...prev, amount: value }))}
        />
        <FormInput
          label={t("owner.fields.expireAfterHours")}
          type="number"
          min="1"
          max="72"
          value={claimCodeForm.expireAfterHours}
          onChange={(value) => onChange((prev) => ({ ...prev, expireAfterHours: value }))}
        />
      </div>
      <FormInput
        label={t("owner.fields.note")}
        value={claimCodeForm.note}
        onChange={(value) => onChange((prev) => ({ ...prev, note: value }))}
      />
      <button type="submit" className="owner-button owner-payment-button" disabled={isPending}>
        {t("owner.createClaim")}
      </button>
    </form>
  );
}

function CompactMenuList({ items, emptyText, onEdit, onDelete, onToggle, t, compact = false }) {
  if (!items.length) {
    return <p className="owner-empty-state">{emptyText}</p>;
  }

  return (
    <div className={`owner-menu-list${compact ? " compact" : ""}`}>
      {items.map((item) => (
        <article key={item.id} className="owner-menu-row">
          <div className="owner-menu-thumb">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} />
            ) : (
              <div className="owner-image-fallback">{buildInitials(item.name)}</div>
            )}
          </div>
          <div className="owner-menu-info">
            <strong>{getFriendlyDisplayName(item.name)}</strong>
            <p>{item.description || t("owner.summaryUnavailable")}</p>
            <span>{formatCurrency(item.price)}</span>
          </div>
          <div className="owner-menu-actions">
            <button
              type="button"
              className={`owner-stock-toggle${item.isAvailable ? " active" : ""}`}
              onClick={() => onToggle(item)}
            >
              {item.isAvailable ? t("owner.available") : t("owner.hidden")}
            </button>
            <button type="button" className="owner-link-button" onClick={() => onEdit(item)}>
              {t("owner.edit")}
            </button>
            {onDelete ? (
              <button type="button" className="owner-link-button danger" onClick={() => onDelete(item.id)}>
                {t("owner.delete")}
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function ClaimCodeList({ claimCodes, emptyText, t }) {
  if (!claimCodes.length) {
    return <p className="owner-empty-state">{emptyText}</p>;
  }

  return (
    <div className="owner-claim-list">
      {claimCodes.map((claimCode) => (
        <article key={claimCode.id} className="owner-claim-row">
          <div>
            <span className="owner-code-label">{claimCode.code}</span>
            <p>
              {t("owner.labels.issuedAt")}: {new Date(claimCode.issuedAt).toLocaleString()}
              {claimCode.note ? ` - ${claimCode.note}` : ""}
            </p>
          </div>
          <strong>{formatCurrency(claimCode.amount)}</strong>
          <span className="owner-status-pill owner-status-pill-neutral">{claimCode.status}</span>
        </article>
      ))}
    </div>
  );
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

function countTodayClaims(claimCodes) {
  const today = new Date().toDateString();
  return claimCodes.filter((claimCode) => {
    if (!claimCode.issuedAt) return false;
    return new Date(claimCode.issuedAt).toDateString() === today;
  }).length;
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
