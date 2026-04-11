import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import "./BottomNav.css";

export default function BottomNav() {
  const currentUser = useSelector((state) => state.app.currentUser);
  const { t } = useTranslation();

  const linkClassName = ({ isActive }) =>
    `bottom-nav__link${isActive ? " bottom-nav__link--active" : ""}`;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {currentUser?.role === "user" ? (
          <NavLink to="/map" className={linkClassName}>
            {t("nav.map")}
          </NavLink>
        ) : null}
        {currentUser?.role === "user" ? (
          <NavLink to="/cooperate" className={linkClassName}>
            {t("nav.cooperate")}
          </NavLink>
        ) : null}
        {currentUser?.role === "owner" ? (
          <NavLink to="/map" className={linkClassName}>
            {t("nav.map")}
          </NavLink>
        ) : null}
        {currentUser?.role === "owner" ? (
          <NavLink to="/owner" className={linkClassName}>
            {t("nav.owner")}
          </NavLink>
        ) : null}
        {currentUser?.role === "admin" ? (
          <NavLink to="/admin" className={linkClassName}>
            {t("nav.admin")}
          </NavLink>
        ) : null}
      </div>
    </nav>
  );
}
