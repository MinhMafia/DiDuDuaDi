import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { createOwnerUpgradeRequest } from "../services/authService";

export default function CollaborationPage() {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.app.currentUser);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    shopName: "",
    addressLine: "",
    idCardImageUrl: "",
    businessLicenseImageUrl: "",
    note: "",
  });

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
        idCardImageUrl: "",
        businessLicenseImageUrl: "",
        note: "",
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("collaboration.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      style={{ display: "grid", gap: 16, maxWidth: 760, margin: "0 auto" }}
    >
      <article style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>{t("collaboration.title")}</h1>
        <p style={{ color: "#475569" }}>{t("collaboration.subtitle")}</p>
        {currentUser?.displayName ? (
          <strong>
            {t("collaboration.currentUser")}: {currentUser.displayName}
          </strong>
        ) : null}
      </article>

      <article style={cardStyle}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={labelStyle}>
            {t("collaboration.fields.shopName")}
            <input
              required
              value={form.shopName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, shopName: event.target.value }))
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
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
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            {t("collaboration.fields.idCardImageUrl")}
            <input
              value={form.idCardImageUrl}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  idCardImageUrl: event.target.value,
                }))
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            {t("collaboration.fields.businessLicenseImageUrl")}
            <input
              value={form.businessLicenseImageUrl}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  businessLicenseImageUrl: event.target.value,
                }))
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            {t("collaboration.fields.note")}
            <textarea
              rows="3"
              value={form.note}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, note: event.target.value }))
              }
              style={{ ...inputStyle, resize: "vertical", minHeight: 88 }}
            />
          </label>

          {message ? (
            <p style={{ margin: 0, color: "#166534" }}>{message}</p>
          ) : null}
          {error ? (
            <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>
          ) : null}

          <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? t("collaboration.submitting") : t("collaboration.submit")}
          </button>
        </form>
      </article>
    </section>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
};

const labelStyle = {
  display: "grid",
  gap: 6,
  fontWeight: 600,
};

const inputStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  outline: "none",
};

const buttonStyle = {
  border: "none",
  borderRadius: 12,
  background: "#0f766e",
  color: "#fff",
  padding: "12px 14px",
  fontWeight: 700,
  cursor: "pointer",
};
