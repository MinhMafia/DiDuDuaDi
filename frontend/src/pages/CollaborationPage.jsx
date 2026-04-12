import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { createOwnerUpgradeRequest, getMyOwnerUpgradeRequest } from "../services/authService";
import "./CollaborationPage.css";

export default function CollaborationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    shopName: "",
    addressLine: "",
    latitude: "",
    longitude: "",
    idCardImageUrl: "",
    businessLicenseImageUrl: "",
    note: "",
  });

  const latestRequestQuery = useQuery({
    queryKey: ["my-owner-upgrade-request", currentUser?.username],
    queryFn: getMyOwnerUpgradeRequest,
    enabled: Boolean(currentUser?.username),
    select: (response) => response.data,
  });

  const latestRequest = latestRequestQuery.data;
  const showForm = !latestRequest || latestRequest.status === "rejected";
  const waitingAdmin = latestRequest?.status === "pending";
  const waitingPayment = latestRequest?.status === "payment_pending";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setSubmitting(true);
      const response = await createOwnerUpgradeRequest(form);
      setMessage(response.message || t("collaboration.success"));
      setForm({
        shopName: "",
        addressLine: "",
        latitude: "",
        longitude: "",
        idCardImageUrl: "",
        businessLicenseImageUrl: "",
        note: "",
      });
      await queryClient.invalidateQueries({
        queryKey: ["my-owner-upgrade-request", currentUser?.username],
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("collaboration.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="collaboration-page">
      <article className="collaboration-card">
        <h1 style={{ marginTop: 0 }}>{t("collaboration.title")}</h1>
        <p style={{ color: "#475569" }}>{t("collaboration.subtitle")}</p>
        {currentUser?.displayName ? (
          <strong>
            {t("collaboration.currentUser")}: {currentUser.displayName}
          </strong>
        ) : null}
      </article>

      {latestRequestQuery.isLoading ? (
        <article className="collaboration-card">
          <p style={{ margin: 0 }}>{t("common.loading")}</p>
        </article>
      ) : null}

      {latestRequestQuery.error ? (
        <article className="collaboration-card">
          <p style={{ margin: 0, color: "#b91c1c" }}>
            {latestRequestQuery.error.message || t("collaboration.error")}
          </p>
        </article>
      ) : null}

      {latestRequest ? (
        <article className="collaboration-card">
          <div className="collaboration-status-head">
            <div>
              <h2 style={{ margin: "0 0 8px" }}>
                {t("collaboration.latestRequestTitle", { defaultValue: "Yeu cau gan nhat" })}
              </h2>
              <p style={{ margin: 0, color: "#475569" }}>
                {latestRequest.shopName} - {latestRequest.addressLine}
              </p>
            </div>
            <span
              className="collaboration-status-badge"
              style={getRequestStatusStyle(latestRequest.status)}
            >
              {translateRequestStatus(t, latestRequest.status)}
            </span>
          </div>

          {latestRequest.reviewNote ? (
            <p className="collaboration-info-text">
              {t("collaboration.reviewNote", { defaultValue: "Ghi chu tu admin" })}:{" "}
              {latestRequest.reviewNote}
            </p>
          ) : null}

          {waitingAdmin ? (
            <div className="collaboration-notice">
              <strong>
                {t("collaboration.waitingReviewTitle", {
                  defaultValue: "Ho so dang cho admin duyet",
                })}
              </strong>
              <p style={{ margin: "8px 0 0", color: "#475569" }}>
                {t("collaboration.waitingReviewDescription", {
                  defaultValue:
                    "Khi admin dong y, he thong se phat sinh ma QR thanh toan phi nang quyen truoc khi kich hoat tai khoan chu quan.",
                })}
              </p>
            </div>
          ) : null}

          {waitingPayment ? (
            <div className="collaboration-payment-layout">
              <div className="collaboration-notice">
                <strong>
                  {t("collaboration.paymentTitle", { defaultValue: "Thanh toan phi nang quyen" })}
                </strong>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  {t("collaboration.paymentDescription", {
                    defaultValue:
                      "Admin da duyet so bo. Hay quet ma QR de thanh toan, sau do admin se xac nhan va kich hoat quyen chu quan.",
                  })}
                </p>

                <div className="collaboration-detail-grid">
                  <DetailRow
                    label={t("collaboration.feeAmount", { defaultValue: "Phi nang quyen" })}
                    value={formatCurrency(latestRequest.upgradeFeeAmount)}
                  />
                  <DetailRow
                    label={t("collaboration.fields.latitude")}
                    value={formatCoordinate(latestRequest.latitude)}
                  />
                  <DetailRow
                    label={t("collaboration.fields.longitude")}
                    value={formatCoordinate(latestRequest.longitude)}
                  />
                  <DetailRow
                    label={t("collaboration.paymentReference", {
                      defaultValue: "Ma chuyen khoan",
                    })}
                    value={latestRequest.paymentReferenceCode || "-"}
                  />
                  <DetailRow
                    label={t("collaboration.paymentRequestedAt", {
                      defaultValue: "Thoi diem tao QR",
                    })}
                    value={
                      latestRequest.paymentRequestedAt
                        ? new Date(latestRequest.paymentRequestedAt).toLocaleString()
                        : "-"
                    }
                  />
                </div>

                {latestRequest.paymentQrContent ? (
                  <div className="collaboration-qr-content">
                    <strong>
                      {t("collaboration.transferMemo", { defaultValue: "Noi dung thanh toan" })}
                    </strong>
                    <code className="collaboration-code">{latestRequest.paymentQrContent}</code>
                  </div>
                ) : null}
              </div>

              <div className="collaboration-qr-panel">
                <strong className="collaboration-qr-title">
                  {t("collaboration.qrLabel", { defaultValue: "Ma QR thanh toan" })}
                </strong>
                {latestRequest.paymentQrImageUrl ? (
                  <img
                    src={latestRequest.paymentQrImageUrl}
                    alt="Owner upgrade payment QR"
                    className="collaboration-qr-image"
                  />
                ) : (
                  <p style={{ margin: 0, color: "#b91c1c" }}>
                    {t("collaboration.qrUnavailable", {
                      defaultValue: "QR chua san sang. Vui long lien he admin.",
                    })}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {latestRequest.status === "rejected" ? (
            <div className="collaboration-rejected">
              <strong>
                {t("collaboration.rejectedTitle", {
                  defaultValue: "Yeu cau truoc da bi tu choi",
                })}
              </strong>
              <p style={{ margin: "8px 0 0", color: "#7f1d1d" }}>
                {t("collaboration.rejectedDescription", {
                  defaultValue:
                    "Ban co the chinh lai thong tin va gui lai mot yeu cau moi o form ben duoi.",
                })}
              </p>
            </div>
          ) : null}
        </article>
      ) : null}

      {showForm ? (
        <article className="collaboration-card">
          <form onSubmit={handleSubmit} className="collaboration-form">
            <label className="collaboration-label">
              {t("collaboration.fields.shopName")}
              <input
                required
                value={form.shopName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, shopName: event.target.value }))
                }
                className="collaboration-input"
              />
            </label>

            <label className="collaboration-label">
              {t("collaboration.fields.address")}
              <input
                required
                value={form.addressLine}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    addressLine: event.target.value,
                  }))
                }
                className="collaboration-input"
              />
            </label>

            <div className="collaboration-form-row">
              <label className="collaboration-label">
                {t("collaboration.fields.latitude")}
                <input
                  required
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      latitude: event.target.value,
                    }))
                  }
                  className="collaboration-input"
                />
              </label>

              <label className="collaboration-label">
                {t("collaboration.fields.longitude")}
                <input
                  required
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      longitude: event.target.value,
                    }))
                  }
                  className="collaboration-input"
                />
              </label>
            </div>

            <label className="collaboration-label">
              {t("collaboration.fields.idCardImageUrl")}
              <input
                value={form.idCardImageUrl}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    idCardImageUrl: event.target.value,
                  }))
                }
                className="collaboration-input"
              />
            </label>

            <label className="collaboration-label">
              {t("collaboration.fields.businessLicenseImageUrl")}
              <input
                value={form.businessLicenseImageUrl}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    businessLicenseImageUrl: event.target.value,
                  }))
                }
                className="collaboration-input"
              />
            </label>

            <label className="collaboration-label">
              {t("collaboration.fields.note")}
              <textarea
                rows="3"
                value={form.note}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, note: event.target.value }))
                }
                className="collaboration-input collaboration-textarea"
              />
            </label>

            {message ? <p style={{ margin: 0, color: "#166534" }}>{message}</p> : null}
            {error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}

            <button type="submit" disabled={submitting} className="collaboration-submit">
              {submitting ? t("collaboration.submitting") : t("collaboration.submit")}
            </button>
          </form>
        </article>
      ) : null}
    </section>
  );
}

function translateRequestStatus(t, status) {
  if (status === "pending") {
    return t("collaboration.status.pending", { defaultValue: "Dang cho duyet" });
  }
  if (status === "payment_pending") {
    return t("collaboration.status.paymentPending", { defaultValue: "Cho thanh toan" });
  }
  if (status === "approved") {
    return t("collaboration.status.approved", { defaultValue: "Da kich hoat" });
  }
  if (status === "rejected") {
    return t("collaboration.status.rejected", { defaultValue: "Bi tu choi" });
  }
  return status;
}

function getRequestStatusStyle(status) {
  if (status === "payment_pending") {
    return { background: "#fef3c7", color: "#92400e" };
  }
  if (status === "approved") {
    return { background: "#dcfce7", color: "#166534" };
  }
  if (status === "rejected") {
    return { background: "#fee2e2", color: "#b91c1c" };
  }
  return { background: "#e0f2fe", color: "#0f4c81" };
}

function DetailRow({ label, value }) {
  return (
    <div className="collaboration-detail-row">
      <span className="collaboration-detail-label">{label}</span>
      <strong className="collaboration-detail-value">{value}</strong>
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

function formatCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : String(value);
}
