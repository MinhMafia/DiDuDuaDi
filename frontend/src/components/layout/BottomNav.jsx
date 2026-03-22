import { NavLink } from "react-router-dom";

export default function BottomNav() {
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
      <NavLink to="/" style={linkStyle}>
        Home
      </NavLink>
      <NavLink to="/map" style={linkStyle}>
        Map
      </NavLink>
      <NavLink to="/routes" style={linkStyle}>
        Routes
      </NavLink>
      <NavLink to="/settings" style={linkStyle}>
        Settings
      </NavLink>
    </nav>
  );
}
