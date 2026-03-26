import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.app.currentUser);

  return (
    <section style={pageStyle}>
      <article style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>{t("admin.title")}</h1>
        <p style={{ color: "#475569" }}>{t("admin.subtitle")}</p>
        <strong>{currentUser?.displayName}</strong>
      </article>
    </section>
  );
}

const pageStyle = { display: "grid", gap: 16 };
const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 20,
};
