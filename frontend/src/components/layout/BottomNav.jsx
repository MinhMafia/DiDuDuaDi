import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import "./BottomNav.css";

export default function BottomNav() {
  const currentUser = useSelector((state) => state.app.currentUser);
  const { t } = useTranslation();
  const location = useLocation();

  const linkClassName = ({ isActive }) =>
    `bottom-nav__link${isActive ? " bottom-nav__link--active" : ""}`;

  const isOwnerMapActive =
    currentUser?.role === "owner" && location.pathname === "/map";
  const isOwnerDashboardActive =
    currentUser?.role === "owner" && location.pathname === "/owner";
  const isAdminMapActive =
    currentUser?.role === "admin" && location.pathname === "/map";
  const isAdminDashboardActive =
    currentUser?.role === "admin" && location.pathname === "/admin";

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {currentUser?.role === "user" ? (
          <>
            <NavLink to="/map" className={linkClassName}>
              {t("nav.map")}
            </NavLink>
            <NavLink to="/cooperate" className={linkClassName}>
              {t("nav.cooperate")}
            </NavLink>
          </>
        ) : null}

        {currentUser?.role === "owner" ? (
          <>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `bottom-nav__link${isActive || isOwnerMapActive ? " bottom-nav__link--active" : ""}`
              }
            >
              {t("nav.map")}
            </NavLink>
            <NavLink
              to="/owner"
              className={({ isActive }) =>
                `bottom-nav__link${isActive || isOwnerDashboardActive ? " bottom-nav__link--active" : ""}`
              }
            >
              {t("nav.owner")}
            </NavLink>
          </>
        ) : null}

        {currentUser?.role === "admin" ? (
          <>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `bottom-nav__link${isActive || isAdminMapActive ? " bottom-nav__link--active" : ""}`
              }
            >
              {t("nav.map")}
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `bottom-nav__link${isActive || isAdminDashboardActive ? " bottom-nav__link--active" : ""}`
              }
            >
              {t("nav.admin")}
            </NavLink>
          </>
        ) : null}
      </div>
    </nav>
  );
}
