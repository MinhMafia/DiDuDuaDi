import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Loading from "../components/common/Loading";
import {
  createClaimCode,
  createMenuItem,
  deleteMenuItem,
  getOwnerDashboard,
  updateMenuItem,
  updateShopProfile,
} from "../services/ownerService";
import "./OwnerDashboardPage.css";

const EMPTY_PROFILE = {
  shopName: "",
  description: "",
  pendingIntroduction: "",
  addressLine: "",
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

const EMPTY_CLAIM_CODE = {
  amount: "",
  note: "",
  expireAfterHours: 24,
};

export default function OwnerDashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);
  const username = currentUser?.username;
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_ITEM);
  const [claimCodeForm, setClaimCodeForm] = useState(EMPTY_CLAIM_CODE);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const dashboardQuery = useQuery({
    queryKey: ["owner-dashboard", username],
    queryFn: () => getOwnerDashboard(username),
    enabled: Boolean(username),
    select: (response) => response.data,
  });

  useEffect(() => {
    if (!dashboardQuery.data) return;

    setProfileForm({
      shopName: dashboardQuery.data.shopName || "",
      description: dashboardQuery.data.description || "",
      pendingIntroduction: dashboardQuery.data.pendingIntroduction || "",
      addressLine: dashboardQuery.data.addressLine || "",
      openingHours: dashboardQuery.data.openingHours || "",
      phone: dashboardQuery.data.phone || "",
      imageUrl: dashboardQuery.data.imageUrl || "",
    });
  }, [dashboardQuery.data]);

  const invalidateDashboard = () =>
    queryClient.invalidateQueries({ queryKey: ["owner-dashboard", username] });

  const profileMutation = useMutation({
    mutationFn: (payload) => updateShopProfile(username, payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.saved"));
      await invalidateDashboard();
    },
  });

  const createMenuMutation = useMutation({
    mutationFn: (payload) => createMenuItem(username, payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuCreated"));
      setMenuForm(EMPTY_MENU_ITEM);
      setEditingMenuItemId(null);
      await invalidateDashboard();
    },
  });

  const updateMenuMutation = useMutation({
    mutationFn: ({ menuItemId, payload }) => updateMenuItem(username, menuItemId, payload),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuUpdated"));
      setMenuForm(EMPTY_MENU_ITEM);
      setEditingMenuItemId(null);
      await invalidateDashboard();
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (menuItemId) => deleteMenuItem(username, menuItemId),
    onSuccess: async (response) => {
      setFeedback(response.message || t("owner.feedback.menuDeleted"));
      await invalidateDashboard();
    },
  });

  const claimCodeMutation = useMutation({
    mutationFn: (payload) => createClaimCode(username, payload),
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

  function handleProfileSubmit(event) {
    event.preventDefault();
    setFeedback("");
    profileMutation.mutate(profileForm);
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
    setMenuForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      imageUrl: item.imageUrl || "",
      isAvailable: Boolean(item.isAvailable),
      displayOrder: item.displayOrder || 0,
    });
  }

  return (
    <section className="owner-page">
      <header className="owner-hero">
        <div>
          <p className="owner-kicker">{t("owner.badge")}</p>
          <h1>{t("owner.title")}</h1>
          <p>{t("owner.subtitle")}</p>
        </div>
        <div className="owner-hero-meta">
          <strong>{currentUser?.displayName}</strong>
          <span>{dashboard?.shopName || t("owner.noShop")}</span>
        </div>
      </header>

      {feedback ? <div className="owner-feedback">{feedback}</div> : null}

      {dashboardQuery.isLoading ? <Loading /> : null}
      {dashboardQuery.error ? (
        <p className="owner-error">
          {dashboardQuery.error.message || t("owner.error")}
        </p>
      ) : null}

      {!dashboard ? null : (
        <div className="owner-grid">
          <article className="owner-card owner-stats-card">
            <h2>{t("owner.statsTitle")}</h2>
            <div className="owner-stats-grid">
              <StatCard label={t("owner.stats.totalVisits")} value={stats?.totalVisitCount ?? 0} />
              <StatCard label={t("owner.stats.audioPlays")} value={stats?.totalAudioPlayCount ?? 0} />
              <StatCard label={t("owner.stats.claimCodes")} value={stats?.claimCodesIssuedCount ?? 0} />
              <StatCard label={t("owner.stats.todayVisits")} value={stats?.visitCountToday ?? 0} />
              <StatCard label={t("owner.stats.todayAudio")} value={stats?.audioPlayCountToday ?? 0} />
            </div>
          </article>

          <article className="owner-card">
            <h2>{t("owner.shopInfoTitle")}</h2>
            <form className="owner-form" onSubmit={handleProfileSubmit}>
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
                <span>{t("owner.fields.address")}</span>
                <input
                  value={profileForm.addressLine}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, addressLine: event.target.value }))
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
                  rows="4"
                  value={profileForm.pendingIntroduction}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      pendingIntroduction: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="owner-inline-grid">
                <label>
                  <span>{t("owner.fields.hours")}</span>
                  <input
                    value={profileForm.openingHours}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, openingHours: event.target.value }))
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
                <span>{t("owner.fields.imageUrl")}</span>
                <input
                  value={profileForm.imageUrl}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                  }
                />
              </label>
              <div className="owner-status-pill">{dashboard.introReviewStatus}</div>
              <button type="submit" className="owner-button" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? t("owner.saving") : t("owner.saveProfile")}
              </button>
            </form>
          </article>

          <article className="owner-card">
            <div className="owner-card-head">
              <div>
                <h2>{t("owner.menuTitle")}</h2>
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
                      setMenuForm((prev) => ({ ...prev, displayOrder: event.target.value }))
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

            <div className="owner-menu-list">
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
                      onClick={() => deleteMenuMutation.mutate(item.id)}
                    >
                      {t("owner.delete")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="owner-card">
            <h2>{t("owner.claimTitle")}</h2>
            <p>{t("owner.claimSubtitle")}</p>
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
              <button type="submit" className="owner-button" disabled={claimCodeMutation.isPending}>
                {t("owner.createClaim")}
              </button>
            </form>

            <div className="owner-claim-list">
              {claimCodes.map((claimCode) => (
                <article key={claimCode.id} className="owner-claim-card">
                  <div className="owner-claim-top">
                    <strong>{claimCode.code}</strong>
                    <span className="owner-status-pill">{claimCode.status}</span>
                  </div>
                  <p>{formatCurrency(claimCode.amount)}</p>
                  <small>{new Date(claimCode.issuedAt).toLocaleString()} {claimCode.note ? `- ${claimCode.note}` : ""}</small>
                </article>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="owner-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
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
