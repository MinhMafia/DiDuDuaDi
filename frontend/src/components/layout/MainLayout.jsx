import BottomNav from "./BottomNav";
import ChatButton from "../chat/ChatButton";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/appSlice";
import "./MainLayout.css";

export default function MainLayout({ children }) {
  const currentUser = useSelector((state) => state.app.currentUser);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  function handleLogout() {
    dispatch(logout());
    window.localStorage.removeItem("didududadi.session");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <strong className="app-header__title">{t("appName")}</strong>
          <span className="app-header__meta">
            {currentUser
              ? `${t(`auth.roles.${currentUser.role}`)} • ${currentUser.displayName}`
              : t("layout.tagline")}
          </span>
        </div>
        <div className="app-header__actions">
          <LanguageSwitcher />
          <button type="button" onClick={handleLogout} className="app-logout">
            {t("auth.logout")}
          </button>
        </div>
      </header>
      <main className="">{children}</main>
      <BottomNav />
      <ChatButton />
    </div>
  );
}
