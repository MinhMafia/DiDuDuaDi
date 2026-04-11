import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Loading from "../components/common/Loading";
import {
  cancelOwnerUpgradePayment,
  confirmOwnerUpgradePayment,
  getOwnerUpgradeRequests,
  getShopIntroReviews,
  reviewOwnerUpgradeRequest,
  reviewShopIntro,
} from "../services/adminService";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.app.currentUser);
  const queryClient = useQueryClient();
  const [ownerReviewNotes, setOwnerReviewNotes] = useState({});
  const [introReviewNotes, setIntroReviewNotes] = useState({});

  const refreshOwnerQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests", "open"] });
    queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests", "reviewed"] });
  };

  const pendingOwnerRequestsQuery = useQuery({
    queryKey: ["owner-upgrade-requests", "open"],
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
    select: (response) => response.data ?? [],
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

  const ownerReviewMutation = useMutation({
    mutationFn: ({ requestId, action, reason }) =>
      reviewOwnerUpgradeRequest(requestId, action, reason),
    onSuccess: refreshOwnerQueries,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (requestId) => confirmOwnerUpgradePayment(requestId),
    onSuccess: refreshOwnerQueries,
  });

  const cancelPaymentMutation = useMutation({
    mutationFn: (requestId) => cancelOwnerUpgradePayment(requestId),
    onSuccess: refreshOwnerQueries,
  });

  const introReviewMutation = useMutation({
    mutationFn: ({ shopId, action, reason }) => reviewShopIntro(shopId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-intro-reviews", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["shop-intro-reviews", "reviewed"] });
    },
  });

  const pendingOwnerRequests = Array.isArray(pendingOwnerRequestsQuery.data)
    ? pendingOwnerRequestsQuery.data
    : [];
  const reviewedOwnerRequests = Array.isArray(reviewedOwnerRequestsQuery.data)
    ? reviewedOwnerRequestsQuery.data
    : [];
  const pendingIntroReviews = Array.isArray(pendingIntroReviewsQuery.data)
    ? pendingIntroReviewsQuery.data
    : [];
  const reviewedIntroReviews = Array.isArray(reviewedIntroReviewsQuery.data)
    ? reviewedIntroReviewsQuery.data
    : [];

  return (
    <section style={pageStyle}>
      <article style={heroCardStyle}>
        <div>
          <p style={eyebrowStyle}>Admin workspace</p>
          <h1 style={{ margin: "6px 0 8px" }}>{t("admin.title")}</h1>
          <p style={heroTextStyle}>{t("admin.subtitle")}</p>
        </div>
        <div style={heroMetaStyle}>
          <span style={heroPillStyle}>Admin</span>
          <strong>{currentUser?.displayName}</strong>
        </div>
      </article>

      <article style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={{ margin: 0 }}>{t("admin.ownerRequestsTitle")}</h2>
            <p style={sectionTextStyle}>{t("admin.ownerRequestsSubtitle")}</p>
          </div>
          <div style={statsRowStyle}>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Dang cho duyet</span>
              <strong style={statValueStyle}>
                {pendingOwnerRequests.filter((item) => item.status === "pending").length}
              </strong>
            </div>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Cho thanh toan</span>
              <strong style={statValueStyle}>
                {pendingOwnerRequests.filter((item) => item.status === "payment_pending").length}
              </strong>
            </div>
          </div>
        </div>

        {pendingOwnerRequestsQuery.isLoading ? <Loading /> : null}
        {pendingOwnerRequestsQuery.error ? (
          <p style={errorTextStyle}>
            {pendingOwnerRequestsQuery.error.message || t("admin.loadOwnerRequestsError")}
          </p>
        ) : null}

        {!pendingOwnerRequestsQuery.isLoading &&
        !pendingOwnerRequestsQuery.error &&
        pendingOwnerRequests.length === 0 ? (
          <p style={sectionTextStyle}>{t("admin.emptyPendingOwnerRequests")}</p>
        ) : null}

        <div style={ownerRequestGridStyle}>
          {pendingOwnerRequests.map((request) => {
            const reviewNote = ownerReviewNotes[request.id] || "";
            const ownerMutationBusy =
              ownerReviewMutation.isPending ||
              confirmPaymentMutation.isPending ||
              cancelPaymentMutation.isPending;

            return (
              <div key={request.id} style={ownerRequestCardStyle}>
                <div style={ownerCardHeaderStyle}>
                  <div>
                    <p style={requestIdStyle}>Request #{request.id}</p>
                    <h3 style={{ margin: "4px 0 6px" }}>{request.shopName}</h3>
                    <p style={compactMutedTextStyle}>
                      {request.username} - {request.displayName}
                    </p>
                  </div>
                  <span
                    style={{
                      ...statusBadgeStyle,
                      ...getOwnerRequestBadgeStyle(request.status),
                    }}
                  >
                    {translateReviewStatus(t, request.status)}
                  </span>
                </div>

                <div style={ownerRequestBodyStyle}>
                  <div style={ownerInfoColumnStyle}>
                    <div style={infoPanelStyle}>
                      <strong style={panelTitleStyle}>Ho so dang ky</strong>
                      <div style={metaGridStyle}>
                        <MetaItem label={t("admin.labels.user")} value={request.username} />
                        <MetaItem label={t("admin.labels.address")} value={request.addressLine} />
                        <MetaItem
                          label={t("admin.labels.idCard")}
                          value={request.idCardImageUrl || "-"}
                        />
                        <MetaItem
                          label={t("admin.labels.businessLicense")}
                          value={request.businessLicenseImageUrl || "-"}
                        />
                      </div>
                      {request.note ? (
                        <div style={noteBlockStyle}>
                          <strong style={panelMiniTitleStyle}>{t("admin.labels.note")}</strong>
                          <p style={noteTextStyle}>{request.note}</p>
                        </div>
                      ) : null}
                    </div>

                    <div style={infoPanelStyle}>
                      <strong style={panelTitleStyle}>Xu ly ho so</strong>
                      {request.status === "pending" ? (
                        <>
                          <textarea
                            value={reviewNote}
                            onChange={(event) =>
                              setOwnerReviewNotes((prev) => ({
                                ...prev,
                                [request.id]: event.target.value,
                              }))
                            }
                            placeholder={t("admin.reviewNotePlaceholder")}
                            style={textareaStyle}
                          />
                          <div style={actionRowStyle}>
                            <button
                              type="button"
                              onClick={() =>
                                ownerReviewMutation.mutate({
                                  requestId: request.id,
                                  action: "approve",
                                  reason: reviewNote || null,
                                })
                              }
                              disabled={ownerMutationBusy}
                              style={approveButtonStyle}
                            >
                              {ownerReviewMutation.isPending
                                ? t("admin.processing")
                                : t("admin.sendPaymentQr", {
                                    defaultValue: "Tao QR thanh toan",
                                  })}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                ownerReviewMutation.mutate({
                                  requestId: request.id,
                                  action: "reject",
                                  reason: reviewNote || null,
                                })
                              }
                              disabled={ownerMutationBusy}
                              style={rejectButtonStyle}
                            >
                              {ownerReviewMutation.isPending ? t("admin.processing") : t("admin.reject")}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={paymentMetaGridStyle}>
                            <MetaItem
                              label={t("admin.upgradeFee", { defaultValue: "Phi nang quyen" })}
                              value={formatCurrency(request.upgradeFeeAmount)}
                            />
                            <MetaItem
                              label={t("admin.paymentReference", {
                                defaultValue: "Ma chuyen khoan",
                              })}
                              value={request.paymentReferenceCode || "-"}
                            />
                            <MetaItem
                              label="Thoi diem tao QR"
                              value={formatDateTime(request.paymentRequestedAt)}
                            />
                            <MetaItem
                              label={t("admin.labels.reviewNote")}
                              value={request.reviewNote || "-"}
                            />
                          </div>
                          <div style={actionRowStyle}>
                            <button
                              type="button"
                              onClick={() => confirmPaymentMutation.mutate(request.id)}
                              disabled={ownerMutationBusy}
                              style={approveButtonStyle}
                            >
                              {confirmPaymentMutation.isPending
                                ? t("admin.processing")
                                : t("admin.confirmPayment", {
                                    defaultValue: "Da nhan phi, kich hoat quyen",
                                  })}
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelPaymentMutation.mutate(request.id)}
                              disabled={ownerMutationBusy}
                              style={secondaryButtonStyle}
                            >
                              {cancelPaymentMutation.isPending
                                ? t("admin.processing")
                                : "Huy ma QR"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={paymentColumnStyle}>
                    {request.status === "payment_pending" && request.paymentQrImageUrl ? (
                      <div style={paymentCardStyle}>
                        <p style={paymentCardLabelStyle}>QR thanh toan</p>
                        <img
                          src={request.paymentQrImageUrl}
                          alt="Owner upgrade payment QR"
                          style={paymentQrImageStyle}
                        />
                        <div style={qrCodeTextStyle}>
                          {request.paymentQrContent || request.paymentReferenceCode}
                        </div>
                      </div>
                    ) : (
                      <div style={placeholderCardStyle}>
                        <strong>Chua tao QR</strong>
                        <p style={compactMutedTextStyle}>
                          Ho so nay dang cho admin xem xet. Sau khi duyet, he thong se tao ma QR
                          thanh toan tai day.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>{t("admin.shopIntroTitle")}</h2>
        <p style={sectionTextStyle}>{t("admin.shopIntroSubtitle")}</p>

        {pendingIntroReviewsQuery.isLoading ? <Loading /> : null}
        {pendingIntroReviewsQuery.error ? (
          <p style={errorTextStyle}>
            {pendingIntroReviewsQuery.error.message || t("admin.loadShopIntrosError")}
          </p>
        ) : null}

        {!pendingIntroReviewsQuery.isLoading &&
        !pendingIntroReviewsQuery.error &&
        pendingIntroReviews.length === 0 ? (
          <p style={sectionTextStyle}>{t("admin.emptyPendingShopIntros")}</p>
        ) : null}

        <div style={{ display: "grid", gap: 10 }}>
          {pendingIntroReviews.map((item) => (
            <div key={item.shopId} style={itemCardStyle}>
              <strong>{item.shopName}</strong>
              <p style={mutedTextStyle}>
                {t("admin.labels.owner")}: {item.ownerDisplayName} ({item.ownerUsername})
              </p>
              <p style={mutedTextStyle}>
                {t("admin.labels.address")}: {item.addressLine}
              </p>

              {item.approvedIntroduction ? (
                <div style={infoBlockStyle}>
                  <strong>{t("admin.labels.currentContent")}</strong>
                  <p style={compactTextStyle}>{item.approvedIntroduction}</p>
                </div>
              ) : null}

              <div style={pendingBlockStyle}>
                <strong>{t("admin.labels.pendingContent")}</strong>
                <p style={compactTextStyle}>
                  {item.pendingIntroduction || t("admin.labels.noContent")}
                </p>
              </div>

              {item.reviewNote ? (
                <p style={compactTextStyle}>
                  {t("admin.labels.latestReviewNote")}: {item.reviewNote}
                </p>
              ) : null}

              <textarea
                value={introReviewNotes[item.shopId] || ""}
                onChange={(event) =>
                  setIntroReviewNotes((prev) => ({ ...prev, [item.shopId]: event.target.value }))
                }
                placeholder={t("admin.reviewNotePlaceholder")}
                style={textareaStyle}
              />

              <div style={actionRowStyle}>
                <button
                  type="button"
                  style={approveButtonStyle}
                  disabled={introReviewMutation.isPending}
                  onClick={() =>
                    introReviewMutation.mutate({
                      shopId: item.shopId,
                      action: "approve",
                      reason: introReviewNotes[item.shopId] || null,
                    })
                  }
                >
                  {introReviewMutation.isPending ? t("admin.processing") : t("admin.approveContent")}
                </button>
                <button
                  type="button"
                  style={rejectButtonStyle}
                  disabled={introReviewMutation.isPending}
                  onClick={() =>
                    introReviewMutation.mutate({
                      shopId: item.shopId,
                      action: "reject",
                      reason: introReviewNotes[item.shopId] || null,
                    })
                  }
                >
                  {introReviewMutation.isPending ? t("admin.processing") : t("admin.reject")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>{t("admin.reviewHistoryTitle")}</h2>
        <p style={sectionTextStyle}>{t("admin.reviewHistorySubtitle")}</p>

        <div style={historyGridStyle}>
          <div style={historyColumnStyle}>
            <h3 style={{ marginTop: 0 }}>{t("admin.ownerHistoryTitle")}</h3>
            {reviewedOwnerRequestsQuery.isLoading ? <Loading /> : null}
            {reviewedOwnerRequestsQuery.error ? (
              <p style={errorTextStyle}>
                {reviewedOwnerRequestsQuery.error.message || t("admin.loadHistoryError")}
              </p>
            ) : null}
            {!reviewedOwnerRequestsQuery.isLoading &&
            !reviewedOwnerRequestsQuery.error &&
            reviewedOwnerRequests.length === 0 ? (
              <p style={sectionTextStyle}>{t("admin.emptyOwnerHistory")}</p>
            ) : null}
            <div style={{ display: "grid", gap: 10 }}>
              {reviewedOwnerRequests.map((request) => (
                <div key={`history-owner-${request.id}`} style={itemCardStyle}>
                  <div style={statusRowStyle}>
                    <strong>{request.shopName}</strong>
                    <span
                      style={{
                        ...statusBadgeStyle,
                        ...(request.status === "approved" ? approvedBadgeStyle : rejectedBadgeStyle),
                      }}
                    >
                      {translateReviewStatus(t, request.status)}
                    </span>
                  </div>
                  <p style={mutedTextStyle}>
                    {t("admin.labels.user")}: {request.username} - {request.displayName}
                  </p>
                  <p style={mutedTextStyle}>
                    {t("admin.labels.address")}: {request.addressLine}
                  </p>
                  {request.reviewNote ? (
                    <p style={compactTextStyle}>
                      {t("admin.labels.reviewNote")}: {request.reviewNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div style={historyColumnStyle}>
            <h3 style={{ marginTop: 0 }}>{t("admin.shopIntroHistoryTitle")}</h3>
            {reviewedIntroReviewsQuery.isLoading ? <Loading /> : null}
            {reviewedIntroReviewsQuery.error ? (
              <p style={errorTextStyle}>
                {reviewedIntroReviewsQuery.error.message || t("admin.loadHistoryError")}
              </p>
            ) : null}
            {!reviewedIntroReviewsQuery.isLoading &&
            !reviewedIntroReviewsQuery.error &&
            reviewedIntroReviews.length === 0 ? (
              <p style={sectionTextStyle}>{t("admin.emptyShopIntroHistory")}</p>
            ) : null}
            <div style={{ display: "grid", gap: 10 }}>
              {reviewedIntroReviews.map((item) => (
                <div key={`history-intro-${item.shopId}`} style={itemCardStyle}>
                  <div style={statusRowStyle}>
                    <strong>{item.shopName}</strong>
                    <span
                      style={{
                        ...statusBadgeStyle,
                        ...(item.reviewStatus === "approved"
                          ? approvedBadgeStyle
                          : rejectedBadgeStyle),
                      }}
                    >
                      {translateReviewStatus(t, item.reviewStatus)}
                    </span>
                  </div>
                  <p style={mutedTextStyle}>
                    {t("admin.labels.owner")}: {item.ownerDisplayName} ({item.ownerUsername})
                  </p>
                  <p style={mutedTextStyle}>
                    {t("admin.labels.address")}: {item.addressLine}
                  </p>
                  {item.reviewNote ? (
                    <p style={compactTextStyle}>
                      {t("admin.labels.reviewNote")}: {item.reviewNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function MetaItem({ label, value }) {
  return (
    <div style={metaItemStyle}>
      <span style={metaLabelStyle}>{label}</span>
      <strong style={metaValueStyle}>{value || "-"}</strong>
    </div>
  );
}

function translateReviewStatus(t, status) {
  if (status === "approved") return t("admin.status.approved");
  if (status === "rejected") return t("admin.status.rejected");
  if (status === "pending") return t("admin.status.pending");
  if (status === "payment_pending") {
    return t("admin.status.paymentPending", { defaultValue: "Cho thanh toan" });
  }
  return status;
}

function getOwnerRequestBadgeStyle(status) {
  if (status === "approved") return approvedBadgeStyle;
  if (status === "rejected") return rejectedBadgeStyle;
  if (status === "payment_pending") return waitingBadgeStyle;
  return neutralBadgeStyle;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

const pageStyle = { display: "grid", gap: 18 };
const heroCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  padding: 24,
  borderRadius: 24,
  background: "linear-gradient(135deg, #f8fafc, #eef6ff)",
  border: "1px solid #dbeafe",
};
const heroMetaStyle = {
  display: "grid",
  gap: 8,
  alignContent: "start",
  justifyItems: "end",
};
const heroPillStyle = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "#dbeafe",
  color: "#1d4ed8",
  fontWeight: 700,
};
const eyebrowStyle = {
  margin: 0,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
};
const heroTextStyle = { margin: 0, color: "#475569", maxWidth: 720 };
const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 24,
  padding: 22,
  display: "grid",
  gap: 16,
};
const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "start",
};
const sectionTextStyle = { margin: "6px 0 0", color: "#475569" };
const statsRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
  gap: 10,
};
const statCardStyle = {
  minWidth: 130,
  padding: "12px 14px",
  borderRadius: 16,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "grid",
  gap: 4,
};
const statLabelStyle = { fontSize: 12, color: "#64748b", textTransform: "uppercase" };
const statValueStyle = { fontSize: 24, lineHeight: 1.1 };
const errorTextStyle = { color: "#b91c1c" };
const ownerRequestGridStyle = { display: "grid", gap: 14 };
const ownerRequestCardStyle = {
  border: "1px solid #dbe4f0",
  borderRadius: 20,
  padding: 18,
  display: "grid",
  gap: 16,
  background: "#fcfdff",
};
const ownerCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};
const requestIdStyle = { margin: 0, color: "#64748b", fontSize: 12, fontWeight: 700 };
const ownerRequestBodyStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.7fr) minmax(260px, 0.9fr)",
  gap: 16,
};
const ownerInfoColumnStyle = { display: "grid", gap: 14 };
const paymentColumnStyle = { display: "grid", alignContent: "start" };
const infoPanelStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  display: "grid",
  gap: 12,
  background: "#fff",
};
const panelTitleStyle = { fontSize: 16, color: "#0f172a" };
const panelMiniTitleStyle = { fontSize: 13, color: "#475569" };
const metaGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};
const paymentMetaGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
};
const metaItemStyle = {
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "10px 12px",
  display: "grid",
  gap: 4,
};
const metaLabelStyle = { color: "#64748b", fontSize: 12 };
const metaValueStyle = {
  color: "#0f172a",
  overflowWrap: "anywhere",
};
const noteBlockStyle = {
  borderRadius: 14,
  border: "1px solid #dbeafe",
  background: "#f8fbff",
  padding: 12,
};
const noteTextStyle = { margin: "6px 0 0", color: "#334155" };
const actionRowStyle = { display: "flex", gap: 10, flexWrap: "wrap" };
const paymentCardStyle = {
  border: "1px solid #bfdbfe",
  background: "linear-gradient(180deg, #f8fbff, #eef6ff)",
  borderRadius: 18,
  padding: 18,
  display: "grid",
  gap: 12,
  justifyItems: "center",
};
const paymentCardLabelStyle = {
  margin: 0,
  color: "#1d4ed8",
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: 12,
  letterSpacing: "0.08em",
};
const placeholderCardStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: 18,
  padding: 18,
  background: "#f8fafc",
  display: "grid",
  gap: 8,
  minHeight: 280,
  alignContent: "center",
  textAlign: "center",
};
const paymentQrImageStyle = {
  width: "100%",
  maxWidth: 240,
  borderRadius: 14,
  background: "#fff",
  border: "1px solid #bfdbfe",
  padding: 10,
};
const qrCodeTextStyle = {
  width: "100%",
  borderRadius: 14,
  background: "#0f172a",
  color: "#f8fafc",
  padding: "10px 12px",
  fontFamily: "Consolas, Monaco, monospace",
  fontSize: 13,
  overflowWrap: "anywhere",
};
const itemCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 8,
};
const mutedTextStyle = { margin: "4px 0", color: "#475569" };
const compactMutedTextStyle = { margin: 0, color: "#475569" };
const compactTextStyle = { margin: "4px 0" };
const approveButtonStyle = {
  border: "none",
  borderRadius: 12,
  background: "#166534",
  color: "#fff",
  padding: "11px 14px",
  fontWeight: 700,
  cursor: "pointer",
  height: "fit-content",
};
const rejectButtonStyle = {
  border: "1px solid #fecaca",
  borderRadius: 12,
  background: "#fff1f2",
  color: "#b91c1c",
  padding: "11px 14px",
  fontWeight: 700,
  cursor: "pointer",
  height: "fit-content",
};
const secondaryButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  background: "#fff",
  color: "#334155",
  padding: "11px 14px",
  fontWeight: 700,
  cursor: "pointer",
  height: "fit-content",
};
const infoBlockStyle = {
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  borderRadius: 12,
  padding: 12,
};
const pendingBlockStyle = {
  border: "1px solid #fed7aa",
  background: "#fff7ed",
  borderRadius: 12,
  padding: 12,
};
const historyGridStyle = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
};
const historyColumnStyle = {
  display: "grid",
  gap: 10,
  alignContent: "start",
};
const statusRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};
const statusBadgeStyle = {
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
};
const neutralBadgeStyle = {
  background: "#e2e8f0",
  color: "#334155",
};
const approvedBadgeStyle = {
  background: "#dcfce7",
  color: "#166534",
};
const waitingBadgeStyle = {
  background: "#fef3c7",
  color: "#92400e",
};
const rejectedBadgeStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
};
const textareaStyle = {
  width: "100%",
  minHeight: 96,
  resize: "vertical",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 14px",
  font: "inherit",
};
