import BottomNav from "./BottomNav";
import ChatButton from "../chat/ChatButton";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/appSlice";

export default function MainLayout({ children }) {
  const currentUser = useSelector((state) => state.app.currentUser);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  function handleLogout() {
    dispatch(logout());
    window.localStorage.removeItem("didududadi.session");
  }

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
          <span style={{ color: "#475569", fontSize: 13 }}>
            {currentUser
              ? `${t(`auth.roles.${currentUser.role}`)} • ${currentUser.displayName}`
              : t("layout.tagline")}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 999,
              background: "#fff",
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {t("auth.logout")}
          </button>
        </div>
      </header>
      <main style={{ padding: 16 }}>{children}</main>
      <BottomNav />
      <ChatButton />
    </div>
  );
}
