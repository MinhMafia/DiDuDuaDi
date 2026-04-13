import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Loading from "../components/common/Loading";
import {
  createClaimCode,
  createMenuItem,
  deleteMenuItem,
  getOwnerDashboard,
  updatePoiContent,
  updateMenuItem,
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
console.log(dashboardQuery.data)
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

  const poiMutation = useMutation({
    mutationFn: (payload) => updatePoiContent(payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.poiSaved"));
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
  const statusTone = getOwnerStatusTone(dashboard?.introReviewStatus);
  const activeStatusLabel = translateOwnerStatus(t, dashboard?.introReviewStatus);
  const primaryPoi = dashboard?.primaryPoi;

  const sections = [
    {
      id: "overview",
      label: t("owner.sections.overview"),
      kicker: t("owner.sections.overviewKicker"),
      description: t("owner.subtitle"),
      badge: activeStatusLabel,
    },
    {
      id: "profile",
      label: t("owner.shopInfoTitle"),
      kicker: t("owner.sections.profileKicker"),
      description: t("owner.sections.profileDescription"),
      badge: dashboard?.shopName || t("owner.summaryUnavailable"),
    },
    {
      id: "poi",
      label: t("owner.poiTitle"),
      kicker: t("owner.sections.mapKicker"),
      description: t("owner.poiSubtitle"),
      badge: primaryPoi?.category || t("owner.summaryUnavailable"),
    },
    {
      id: "menu",
      label: t("owner.menuTitle"),
      kicker: t("owner.sections.menuKicker"),
      description: t("owner.menuSubtitle"),
      badge: `${menuItems.length}`,
    },
    {
      id: "claims",
      label: t("owner.claimTitle"),
      kicker: t("owner.sections.claimKicker"),
      description: t("owner.claimSubtitle"),
      badge: `${claimCodes.length}`,
    },
  ];

  const activeSectionMeta =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  function handleProfileSubmit(event) {
    event.preventDefault();
    setFeedback("");
    profileMutation.mutate({
      ...profileForm,
      latitude: profileForm.latitude === "" ? null : Number(profileForm.latitude),
      longitude: profileForm.longitude === "" ? null : Number(profileForm.longitude),
    });
  }

  function handleMenuSubmit(event) {
    event.preventDefault();
    setFeedback("");

    const payload = {
      ...menuForm,
      price: Number(menuForm.price || 0),
      displayOrder: Number(menuForm.displayOrder || 0),
    };

    if (editingMenuItemId) {
      updateMenuMutation.mutate({ menuItemId: editingMenuItemId, payload });
      return;
    }

    createMenuMutation.mutate(payload);
  }

  function handlePoiSubmit(event) {
    event.preventDefault();
    setFeedback("");
    poiMutation.mutate(poiForm);
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

  function handleDeleteMenuItem(menuItemId) {
    deleteMenuMutation.mutate(menuItemId);
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

  function renderOverviewPanel() {
    return (
      <div className="owner-stage-stack">
        <article className="owner-card owner-stage-card">
          <div className="owner-stage-head">
            <div>
              <p className="owner-section-kicker">{activeSectionMeta.kicker}</p>
              <h2>{activeSectionMeta.label}</h2>
              <p>{activeSectionMeta.description}</p>
            </div>

            <div className="owner-stage-actions">
              <button
                type="button"
                className="owner-button secondary"
                onClick={() => setActiveSection("profile")}
              >
                {t("owner.shopInfoTitle")}
              </button>
              <button
                type="button"
                className="owner-button secondary"
                onClick={() => setActiveSection("menu")}
              >
                {t("owner.menuTitle")}
              </button>
              <button
                type="button"
                className="owner-button secondary"
                onClick={() => setActiveSection("claims")}
              >
                {t("owner.claimTitle")}
              </button>
            </div>
          </div>

          <div className="owner-stats-grid owner-stats-grid-wide">
            <StatCard label={t("owner.stats.totalVisits")} value={stats?.totalVisitCount ?? 0} />
            <StatCard label={t("owner.stats.audioPlays")} value={stats?.totalAudioPlayCount ?? 0} />
            <StatCard label={t("owner.stats.claimCodes")} value={stats?.claimCodesIssuedCount ?? 0} />
            <StatCard label={t("owner.stats.todayVisits")} value={stats?.visitCountToday ?? 0} />
            <StatCard label={t("owner.stats.todayAudio")} value={stats?.audioPlayCountToday ?? 0} />
          </div>
        </article>

        <div className="owner-overview-grid">
          <article className="owner-card owner-overview-card">
            <div className="owner-card-head">
              <div>
                <p className="owner-section-kicker">{t("owner.sections.profileKicker")}</p>
                <h2>{t("owner.sections.overview")}</h2>
              </div>
            </div>

            <div className="owner-summary-list">
              <SummaryRow label={t("owner.fields.shopName")} value={dashboard.shopName} />
              <SummaryRow
                label={t("owner.fields.address")}
                value={dashboard.addressLine || t("owner.summaryUnavailable")}
              />
              <SummaryRow
                label={t("owner.fields.hours")}
                value={dashboard.openingHours || t("owner.summaryUnavailable")}
              />
              <SummaryRow
                label={t("owner.fields.phone")}
                value={dashboard.phone || t("owner.summaryUnavailable")}
              />
            </div>
          </article>

          <article className="owner-card owner-overview-card">
            <div className="owner-card-head">
              <div>
                <p className="owner-section-kicker">{t("owner.sections.mapKicker")}</p>
                <h2>{t("owner.poiTitle")}</h2>
              </div>
              <div className={`owner-status-pill owner-status-pill-${statusTone}`}>
                {activeStatusLabel}
              </div>
            </div>

            <div className="owner-overview-list">
              <SummaryRow
                label={t("owner.fields.poiCategory")}
                value={primaryPoi?.category || t("owner.summaryUnavailable")}
              />
              <SummaryRow
                label={t("owner.fields.poiNameVi")}
                value={primaryPoi?.nameVi || t("owner.summaryUnavailable")}
              />
              <p className="owner-surface-note">
                {dashboard.pendingIntroduction || dashboard.approvedIntroduction || t("owner.summaryFallback")}
              </p>
            </div>
          </article>

          <article className="owner-card owner-overview-card">
            <div className="owner-card-head">
              <div>
                <p className="owner-section-kicker">{t("owner.sections.menuListKicker")}</p>
                <h2>{t("owner.sections.menuList")}</h2>
                <p>{t("owner.sections.menuListDescription")}</p>
              </div>
              <button
                type="button"
                className="owner-button secondary"
                onClick={() => setActiveSection("menu")}
              >
                {t("owner.menuTitle")}
              </button>
            </div>

            <div className="owner-mini-list">
              {menuItems.length === 0 ? (
                <p className="owner-empty-state">{t("owner.empty.menu")}</p>
              ) : (
                menuItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="owner-mini-row">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.description || t("owner.summaryUnavailable")}</span>
                    </div>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="owner-card owner-overview-card">
            <div className="owner-card-head">
              <div>
                <p className="owner-section-kicker">{t("owner.sections.claimHistoryKicker")}</p>
                <h2>{t("owner.sections.claimHistory")}</h2>
                <p>{t("owner.sections.claimHistoryDescription")}</p>
              </div>
              <button
                type="button"
                className="owner-button secondary"
                onClick={() => setActiveSection("claims")}
              >
                {t("owner.claimTitle")}
              </button>
            </div>

            <div className="owner-mini-list">
              {claimCodes.length === 0 ? (
                <p className="owner-empty-state">{t("owner.empty.claims")}</p>
              ) : (
                claimCodes.slice(0, 3).map((claimCode) => (
                  <div key={claimCode.id} className="owner-mini-row">
                    <div>
                      <strong>{claimCode.code}</strong>
                      <span>{claimCode.note || t("owner.summaryUnavailable")}</span>
                    </div>
                    <span>{formatCurrency(claimCode.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </div>
    );
  }

  function renderProfilePanel() {
    return (
      <article className="owner-card owner-stage-card">
        <div className="owner-stage-head">
          <div>
            <p className="owner-section-kicker">{t("owner.sections.profileKicker")}</p>
            <h2>{t("owner.shopInfoTitle")}</h2>
            <p>{t("owner.sections.profileDescription")}</p>
          </div>
          <div className={`owner-status-pill owner-status-pill-${statusTone}`}>
            {translateOwnerStatus(t, dashboard.introReviewStatus)}
          </div>
        </div>

        <form className="owner-form" onSubmit={handleProfileSubmit}>
          <div className="owner-inline-grid">
            <label>
              <span>{t("owner.fields.shopName")}</span>
              <input
                value={profileForm.shopName}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, shopName: event.target.value }))
                }
              />
            </label>
            <label>
              <span>{t("owner.fields.phone")}</span>
              <input
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </label>
          </div>

          <label>
            <span>{t("owner.fields.address")}</span>
            <input
              value={profileForm.addressLine}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, addressLine: event.target.value }))
              }
            />
          </label>

          <div className="owner-inline-grid owner-inline-grid-3">
            <label>
              <span>{t("owner.fields.latitude")}</span>
              <input
                type="number"
                step="0.000001"
                value={profileForm.latitude}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, latitude: event.target.value }))
                }
              />
            </label>
            <label>
              <span>{t("owner.fields.longitude")}</span>
              <input
                type="number"
                step="0.000001"
                value={profileForm.longitude}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, longitude: event.target.value }))
                }
              />
            </label>
            <label>
              <span>{t("owner.fields.hours")}</span>
              <input
                value={profileForm.openingHours}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, openingHours: event.target.value }))
                }
              />
            </label>
          </div>

          <label>
            <span>{t("owner.fields.imageUrl")}</span>
            <input
              value={profileForm.imageUrl}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, imageUrl: event.target.value }))
              }
            />
          </label>

          <label>
            <span>{t("owner.fields.description")}</span>
            <textarea
              rows="3"
              value={profileForm.description}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </label>

          <label>
            <span>{t("owner.fields.pendingIntro")}</span>
            <textarea
              rows="5"
              value={profileForm.pendingIntroduction}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  pendingIntroduction: event.target.value,
                }))
              }
            />
          </label>

          <button
            type="submit"
            className="owner-button"
            disabled={profileMutation.isPending}
          >
            {profileMutation.isPending ? t("owner.saving") : t("owner.saveProfile")}
          </button>
        </form>
      </article>
    );
  }

  function renderPoiPanel() {
    return (
      <article className="owner-card owner-stage-card">
        <div className="owner-stage-head">
          <div>
            <p className="owner-section-kicker">{t("owner.sections.mapKicker")}</p>
            <h2>{t("owner.poiTitle")}</h2>
            <p>{t("owner.poiSubtitle")}</p>
          </div>
        </div>

        <form className="owner-form" onSubmit={handlePoiSubmit}>
          <label>
            <span>{t("owner.fields.poiCategory")}</span>
            <input
              value={poiForm.category}
              onChange={(event) =>
                setPoiForm((prev) => ({ ...prev, category: event.target.value }))
              }
            />
          </label>

          <div className="owner-inline-grid">
            <label>
              <span>{t("owner.fields.poiNameVi")}</span>
              <input
                value={poiForm.nameVi}
                onChange={(event) =>
                  setPoiForm((prev) => ({ ...prev, nameVi: event.target.value }))
                }
              />
            </label>
            <label>
              <span>{t("owner.fields.poiNameEn")}</span>
              <input
                value={poiForm.nameEn}
                onChange={(event) =>
                  setPoiForm((prev) => ({ ...prev, nameEn: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="owner-inline-grid">
            <label>
              <span>{t("owner.fields.poiDescriptionVi")}</span>
              <textarea
                rows="5"
                value={poiForm.descriptionVi}
                onChange={(event) =>
                  setPoiForm((prev) => ({ ...prev, descriptionVi: event.target.value }))
                }
              />
            </label>
            <label>
              <span>{t("owner.fields.poiDescriptionEn")}</span>
              <textarea
                rows="5"
                value={poiForm.descriptionEn}
                onChange={(event) =>
                  setPoiForm((prev) => ({ ...prev, descriptionEn: event.target.value }))
                }
              />
            </label>
          </div>

          <button
            type="submit"
            className="owner-button"
            disabled={poiMutation.isPending}
          >
            {poiMutation.isPending ? t("owner.saving") : t("owner.savePoi")}
          </button>
        </form>
      </article>
    );
  }

  function renderMenuPanel() {
    return (
      <div className="owner-stage-stack">
        <article className="owner-card owner-stage-card">
          <div className="owner-stage-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.menuKicker")}</p>
              <h2>{editingMenuItemId ? t("owner.sections.editMenu") : t("owner.menuTitle")}</h2>
              <p>{t("owner.menuSubtitle")}</p>
            </div>
          </div>

          <form className="owner-form" onSubmit={handleMenuSubmit}>
            <div className="owner-inline-grid">
              <label>
                <span>{t("owner.fields.menuName")}</span>
                <input
                  value={menuForm.name}
                  onChange={(event) =>
                    setMenuForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>{t("owner.fields.price")}</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={menuForm.price}
                  onChange={(event) =>
                    setMenuForm((prev) => ({ ...prev, price: event.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              <span>{t("owner.fields.menuDescription")}</span>
              <textarea
                rows="3"
                value={menuForm.description}
                onChange={(event) =>
                  setMenuForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>

            <div className="owner-inline-grid">
              <label>
                <span>{t("owner.fields.imageUrl")}</span>
                <input
                  value={menuForm.imageUrl}
                  onChange={(event) =>
                    setMenuForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>{t("owner.fields.order")}</span>
                <input
                  type="number"
                  min="0"
                  value={menuForm.displayOrder}
                  onChange={(event) =>
                    setMenuForm((prev) => ({
                      ...prev,
                      displayOrder: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className="owner-checkbox">
              <input
                type="checkbox"
                checked={menuForm.isAvailable}
                onChange={(event) =>
                  setMenuForm((prev) => ({ ...prev, isAvailable: event.target.checked }))
                }
              />
              <span>{t("owner.fields.available")}</span>
            </label>

            <div className="owner-form-actions">
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
        </article>

        <article className="owner-card owner-stage-card">
          <div className="owner-card-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.menuListKicker")}</p>
              <h2>{t("owner.sections.menuList")}</h2>
              <p>{t("owner.sections.menuListDescription")}</p>
            </div>
          </div>

          <div className="owner-menu-list">
            {menuItems.length === 0 ? (
              <p className="owner-empty-state">{t("owner.empty.menu")}</p>
            ) : null}

            {menuItems.map((item) => (
              <article key={item.id} className="owner-menu-card">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
                <div className="owner-menu-meta">
                  <span>{formatCurrency(item.price)}</span>
                  <span>{item.isAvailable ? t("owner.available") : t("owner.hidden")}</span>
                </div>
                <div className="owner-form-actions">
                  <button
                    type="button"
                    className="owner-button secondary"
                    onClick={() => startEditMenuItem(item)}
                  >
                    {t("owner.edit")}
                  </button>
                  <button
                    type="button"
                    className="owner-button danger"
                    onClick={() => handleDeleteMenuItem(item.id)}
                  >
                    {t("owner.delete")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderClaimsPanel() {
    return (
      <div className="owner-stage-stack">
        <article className="owner-card owner-stage-card">
          <div className="owner-stage-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.claimKicker")}</p>
              <h2>{t("owner.claimTitle")}</h2>
              <p>{t("owner.claimSubtitle")}</p>
            </div>
          </div>

          <form className="owner-form" onSubmit={handleClaimSubmit}>
            <div className="owner-inline-grid">
              <label>
                <span>{t("owner.fields.amount")}</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={claimCodeForm.amount}
                  onChange={(event) =>
                    setClaimCodeForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>{t("owner.fields.expireAfterHours")}</span>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={claimCodeForm.expireAfterHours}
                  onChange={(event) =>
                    setClaimCodeForm((prev) => ({
                      ...prev,
                      expireAfterHours: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label>
              <span>{t("owner.fields.note")}</span>
              <input
                value={claimCodeForm.note}
                onChange={(event) =>
                  setClaimCodeForm((prev) => ({ ...prev, note: event.target.value }))
                }
              />
            </label>

            <button
              type="submit"
              className="owner-button"
              disabled={claimCodeMutation.isPending}
            >
              {t("owner.createClaim")}
            </button>
          </form>
        </article>

        <article className="owner-card owner-stage-card">
          <div className="owner-card-head">
            <div>
              <p className="owner-section-kicker">{t("owner.sections.claimHistoryKicker")}</p>
              <h2>{t("owner.sections.claimHistory")}</h2>
              <p>{t("owner.sections.claimHistoryDescription")}</p>
            </div>
          </div>

          <div className="owner-claim-list">
            {claimCodes.length === 0 ? (
              <p className="owner-empty-state">{t("owner.empty.claims")}</p>
            ) : null}

            {claimCodes.map((claimCode) => (
              <article key={claimCode.id} className="owner-claim-card">
                <div className="owner-claim-top">
                  <strong>{claimCode.code}</strong>
                  <span className="owner-status-pill owner-status-pill-neutral">
                    {claimCode.status}
                  </span>
                </div>
                <p>{formatCurrency(claimCode.amount)}</p>
                <small>
                  {t("owner.labels.issuedAt")}: {new Date(claimCode.issuedAt).toLocaleString()}{" "}
                  {claimCode.note ? `- ${claimCode.note}` : ""}
                </small>
              </article>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderActivePanel() {
    if (!dashboard) return null;
    if (activeSection === "profile") return renderProfilePanel();
    if (activeSection === "poi") return renderPoiPanel();
    if (activeSection === "menu") return renderMenuPanel();
    if (activeSection === "claims") return renderClaimsPanel();
    return renderOverviewPanel();
  }

  return (
    <section className="owner-page">
      <header className="owner-hero">
        <div className="owner-hero-copy">
          <p className="owner-kicker">{t("owner.badge")}</p>
          <h1>{t("owner.title")}</h1>
          <p>{t("owner.subtitle")}</p>

          <div className="owner-hero-actions">
            <Link className="owner-button owner-button-link" to="/map">
              {t("owner.viewMap")}
            </Link>
          </div>
        </div>

        <div className="owner-hero-summary">
          <div className={`owner-status-pill owner-status-pill-${statusTone}`}>
            {activeStatusLabel}
          </div>
          <strong>{dashboard?.shopName || t("owner.noShop")}</strong>
          <span>{currentUser?.displayName}</span>
          {dashboard?.addressLine ? <p>{dashboard.addressLine}</p> : <p>{t("owner.summaryFallback")}</p>}
        </div>
      </header>

      {feedback ? <div className="owner-feedback">{feedback}</div> : null}

      {dashboardQuery.isLoading ? <Loading /> : null}
      {dashboardQuery.error ? (
        <p className="owner-error">{dashboardQuery.error.message || t("owner.error")}</p>
      ) : null}

      {!dashboard ? null : (
        <div className="owner-dashboard-shell">
          <aside className="owner-dashboard-nav">
            <article className="owner-card owner-nav-summary">
              <div className="owner-card-head">
                <div>
                  <p className="owner-section-kicker">{t("owner.sections.overviewKicker")}</p>
                  <h2>{dashboard.shopName}</h2>
                </div>
              </div>

              <div className="owner-summary-list">
                <SummaryRow label={t("owner.fields.address")} value={dashboard.addressLine || t("owner.summaryUnavailable")} />
                <SummaryRow label={t("owner.labels.menuCount")} value={String(menuItems.length)} />
                <SummaryRow label={t("owner.stats.claimCodes")} value={String(stats?.claimCodesIssuedCount ?? 0)} />
              </div>
            </article>

            <article className="owner-card owner-nav-card">
              <div className="owner-card-head">
                <div>
                  <p className="owner-section-kicker">{t("owner.badge")}</p>
                  <h2>{activeSectionMeta.label}</h2>
                  <p>{activeSectionMeta.description}</p>
                </div>
              </div>

              <div className="owner-nav-list">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className={`owner-nav-button ${activeSection === section.id ? "active" : ""}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div className="owner-nav-button-copy">
                      <span>{section.kicker}</span>
                      <strong>{section.label}</strong>
                      <small>{section.description}</small>
                    </div>
                    <span className="owner-nav-badge">{section.badge}</span>
                  </button>
                ))}
              </div>
            </article>
          </aside>

          <div className="owner-dashboard-stage">{renderActivePanel()}</div>
        </div>
      )}
    </section>
  );
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

function StatCard({ label, value }) {
  return (
    <div className="owner-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="owner-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
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
