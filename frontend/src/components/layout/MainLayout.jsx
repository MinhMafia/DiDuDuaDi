import BottomNav from "./BottomNav";
import ChatButton from "../chat/ChatButton";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function MainLayout({ children }) {
  const { t } = useTranslation();

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 64 }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "12px 16px",
          background: "rgba(248, 250, 252, 0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong style={{ display: "block", fontSize: 18 }}>{t("appName")}</strong>
          <span style={{ color: "#475569", fontSize: 13 }}>{t("layout.tagline")}</span>
        </div>
        <LanguageSwitcher />
      </header>
      <main style={{ padding: 16 }}>{children}</main>
      <BottomNav />
      <ChatButton />
    </div>
  );
}
