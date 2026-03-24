import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function BottomNav() {
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
      <NavLink to="/map" style={linkStyle}>
        {t("nav.map")}
      </NavLink>
      <NavLink to="/settings" style={linkStyle}>
        {t("nav.settings")}
      </NavLink>
    </nav>
  );
}
