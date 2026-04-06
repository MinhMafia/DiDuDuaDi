import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Loading from "../components/common/Loading";
import {
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

  const pendingOwnerRequestsQuery = useQuery({
    queryKey: ["owner-upgrade-requests", "pending"],
    queryFn: () => getOwnerUpgradeRequests("pending"),
    select: (response) => response.data ?? [],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests", "reviewed"] });
    },
  });

  const introReviewMutation = useMutation({
    mutationFn: ({ shopId, action, reason }) => reviewShopIntro(shopId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-intro-reviews", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["shop-intro-reviews", "reviewed"] });
    },
  });

  return (
    <section style={pageStyle}>
      <article style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>{t("admin.title")}</h1>
        <p style={{ color: "#475569" }}>{t("admin.subtitle")}</p>
        <strong>{currentUser?.displayName}</strong>
      </article>

      <article style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>{t("admin.ownerRequestsTitle")}</h2>
        <p style={{ color: "#475569" }}>{t("admin.ownerRequestsSubtitle")}</p>

        {pendingOwnerRequestsQuery.isLoading ? <Loading /> : null}
        {pendingOwnerRequestsQuery.error ? (
          <p style={{ color: "#b91c1c" }}>
            {pendingOwnerRequestsQuery.error.message || t("admin.loadOwnerRequestsError")}
          </p>
        ) : null}

        {!pendingOwnerRequestsQuery.isLoading &&
        !pendingOwnerRequestsQuery.error &&
        pendingOwnerRequestsQuery.data.length === 0 ? (
          <p style={{ color: "#475569" }}>{t("admin.emptyPendingOwnerRequests")}</p>
        ) : null}

        <div style={{ display: "grid", gap: 10 }}>
          {pendingOwnerRequestsQuery.data.map((request) => (
            <div key={request.id} style={itemCardStyle}>
              <div style={itemHeadStyle}>
                <div>
                  <strong>{request.shopName}</strong>
                  <p style={mutedTextStyle}>
                    {t("admin.labels.user")}: {request.username} - {request.displayName}
                  </p>
                  <p style={mutedTextStyle}>
                    {t("admin.labels.address")}: {request.addressLine}
                  </p>
                  {request.idCardImageUrl ? (
                    <p style={compactTextStyle}>
                      {t("admin.labels.idCard")}: {request.idCardImageUrl}
                    </p>
                  ) : null}
                  {request.businessLicenseImageUrl ? (
                    <p style={compactTextStyle}>
                      {t("admin.labels.businessLicense")}: {request.businessLicenseImageUrl}
                    </p>
                  ) : null}
                  {request.note ? (
                    <p style={compactTextStyle}>
                      {t("admin.labels.note")}: {request.note}
                    </p>
                  ) : null}
                  {request.reviewNote ? (
                    <p style={compactTextStyle}>
                      {t("admin.labels.reviewNote")}: {request.reviewNote}
                    </p>
                  ) : null}
                </div>
              </div>

              <textarea
                value={ownerReviewNotes[request.id] || ""}
                onChange={(event) =>
                  setOwnerReviewNotes((prev) => ({ ...prev, [request.id]: event.target.value }))
                }
                placeholder={t("admin.reviewNotePlaceholder")}
                style={textareaStyle}
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() =>
                    ownerReviewMutation.mutate({
                      requestId: request.id,
                      action: "approve",
                      reason: ownerReviewNotes[request.id] || null,
                    })
                  }
                  disabled={ownerReviewMutation.isPending}
                  style={approveButtonStyle}
                >
                  {ownerReviewMutation.isPending ? t("admin.processing") : t("admin.approve")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    ownerReviewMutation.mutate({
                      requestId: request.id,
                      action: "reject",
                      reason: ownerReviewNotes[request.id] || null,
                    })
                  }
                  disabled={ownerReviewMutation.isPending}
                  style={rejectButtonStyle}
                >
                  {ownerReviewMutation.isPending ? t("admin.processing") : t("admin.reject")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>{t("admin.shopIntroTitle")}</h2>
        <p style={{ color: "#475569" }}>{t("admin.shopIntroSubtitle")}</p>

        {pendingIntroReviewsQuery.isLoading ? <Loading /> : null}
        {pendingIntroReviewsQuery.error ? (
          <p style={{ color: "#b91c1c" }}>
            {pendingIntroReviewsQuery.error.message || t("admin.loadShopIntrosError")}
          </p>
        ) : null}

        {!pendingIntroReviewsQuery.isLoading &&
        !pendingIntroReviewsQuery.error &&
        pendingIntroReviewsQuery.data.length === 0 ? (
          <p style={{ color: "#475569" }}>{t("admin.emptyPendingShopIntros")}</p>
        ) : null}

        <div style={{ display: "grid", gap: 10 }}>
          {pendingIntroReviewsQuery.data.map((item) => (
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

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
                  {introReviewMutation.isPending
                    ? t("admin.processing")
                    : t("admin.approveContent")}
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
        <p style={{ color: "#475569" }}>{t("admin.reviewHistorySubtitle")}</p>

        <div style={historyGridStyle}>
          <div style={historyColumnStyle}>
            <h3 style={{ marginTop: 0 }}>{t("admin.ownerHistoryTitle")}</h3>
            {reviewedOwnerRequestsQuery.isLoading ? <Loading /> : null}
            {reviewedOwnerRequestsQuery.error ? (
              <p style={{ color: "#b91c1c" }}>
                {reviewedOwnerRequestsQuery.error.message || t("admin.loadHistoryError")}
              </p>
            ) : null}
            {!reviewedOwnerRequestsQuery.isLoading &&
            !reviewedOwnerRequestsQuery.error &&
            reviewedOwnerRequestsQuery.data?.length === 0 ? (
              <p style={{ color: "#475569" }}>{t("admin.emptyOwnerHistory")}</p>
            ) : null}
            <div style={{ display: "grid", gap: 10 }}>
              {(reviewedOwnerRequestsQuery.data ?? []).map((request) => (
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
              <p style={{ color: "#b91c1c" }}>
                {reviewedIntroReviewsQuery.error.message || t("admin.loadHistoryError")}
              </p>
            ) : null}
            {!reviewedIntroReviewsQuery.isLoading &&
            !reviewedIntroReviewsQuery.error &&
            reviewedIntroReviewsQuery.data?.length === 0 ? (
              <p style={{ color: "#475569" }}>{t("admin.emptyShopIntroHistory")}</p>
            ) : null}
            <div style={{ display: "grid", gap: 10 }}>
              {(reviewedIntroReviewsQuery.data ?? []).map((item) => (
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

function translateReviewStatus(t, status) {
  if (status === "approved") return t("admin.status.approved");
  if (status === "rejected") return t("admin.status.rejected");
  if (status === "pending") return t("admin.status.pending");
  return status;
}

const pageStyle = { display: "grid", gap: 16 };
const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 20,
};
const itemCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 8,
};
const itemHeadStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};
const mutedTextStyle = { margin: "4px 0", color: "#475569" };
const compactTextStyle = { margin: "4px 0" };
const approveButtonStyle = {
  border: "none",
  borderRadius: 10,
  background: "#166534",
  color: "#fff",
  padding: "10px 12px",
  fontWeight: 700,
  cursor: "pointer",
  height: "fit-content",
};
const rejectButtonStyle = {
  border: "1px solid #fecaca",
  borderRadius: 10,
  background: "#fff1f2",
  color: "#b91c1c",
  padding: "10px 12px",
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
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
};
const approvedBadgeStyle = {
  background: "#dcfce7",
  color: "#166534",
};
const rejectedBadgeStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
};
const textareaStyle = {
  width: "100%",
  minHeight: 84,
  resize: "vertical",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  font: "inherit",
};
