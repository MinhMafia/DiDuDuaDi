import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

export default function BottomNav() {
  const currentUser = useSelector((state) => state.app.currentUser);
  const { t } = useTranslation();

  const linkStyle = ({ isActive }) => ({
    color: isActive ? "#ff6b35" : "#334155",
    textDecoration: "none",
    fontWeight: 600,
  });

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-around",
        padding: "12px 8px",
      }}
    >
      {currentUser?.role === "user" ? (
        <NavLink to="/map" style={linkStyle}>
          {t("nav.map")}
        </NavLink>
      ) : null}
      {currentUser?.role === "user" ? (
        <NavLink to="/cooperate" style={linkStyle}>
          {t("nav.cooperate")}
        </NavLink>
      ) : null}
      {currentUser?.role === "owner" ? (
        <NavLink to="/owner" style={linkStyle}>
          {t("nav.owner")}
        </NavLink>
      ) : null}
      {currentUser?.role === "admin" ? (
        <NavLink to="/admin" style={linkStyle}>
          {t("nav.admin")}
        </NavLink>
      ) : null}
      <NavLink to="/settings" style={linkStyle}>
        {t("nav.settings")}
      </NavLink>
    </nav>
  );
}
