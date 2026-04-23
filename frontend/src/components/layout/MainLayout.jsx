import BottomNav from "./BottomNav";
import ChatButton from "../chat/ChatButton";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/appSlice";
import "./MainLayout.css";

export default function MainLayout({ children }) {
  const currentUser = useSelector((state) => state.app.currentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  function handleAuthAction() {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    dispatch(logout());
    window.localStorage.removeItem("didududadi.session");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__identity">
          <strong className="app-header__title">{t("appName")}</strong>
          <span className="app-header__meta">
            {currentUser
              ? `${t(`auth.roles.${currentUser.role}`)} | ${currentUser.displayName}`
              : t("layout.tagline")}
          </span>
        </div>

        <div className="app-header__actions">
          <LanguageSwitcher />
          <button type="button" onClick={handleAuthAction} className="app-logout">
            {currentUser ? t("auth.logout") : t("auth.login")}
          </button>
        </div>
      </header>

      <main className="app-main">{children}</main>
      <BottomNav />
      <ChatButton />
    </div>
  );
}
