import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { login } from "../services/authService";
import { loginSuccess } from "../store/slices/appSlice";

const demoAccounts = [
  { username: "user", password: "123456", role: "user" },
  { username: "owner", password: "123456", role: "owner" },
  { username: "admin", password: "123456", role: "admin" },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    username: "user",
    password: "123456",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      const response = await login(form.username, form.password);
      const session = response.data;

      dispatch(loginSuccess(session));
      window.localStorage.setItem("didududadi.session", JSON.stringify(session));

      const nextPath = location.state?.from?.pathname || getDefaultPathByRole(session.role);
      navigate(nextPath, { replace: true });
    } catch (loginError) {
      setError(loginError.response?.data?.message || t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.65), transparent 34%), linear-gradient(160deg, #fff7ed, #ecfeff 46%, #eff6ff)",
      }}
    >
      <div
        style={{
          width: "min(100%, 480px)",
          background: "rgba(255,255,255,0.95)",
          border: "1px solid #e2e8f0",
          borderRadius: 28,
          padding: 24,
          boxShadow: "0 24px 56px rgba(15, 23, 42, 0.14)",
          display: "grid",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: "0 0 8px", color: "#0f766e", fontWeight: 800 }}>
              {t("auth.badge")}
            </p>
            <h1 style={{ margin: 0 }}>{t("auth.title")}</h1>
            <p style={{ marginBottom: 0, color: "#475569" }}>{t("auth.subtitle")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: 18,
            border: "1px solid #e2e8f0",
            padding: 16,
            display: "grid",
            gap: 8,
          }}
        >
          <strong>{t("auth.demoAccounts")}</strong>
          {demoAccounts.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => setForm({ username: account.username, password: account.password })}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "10px 12px",
                background: "#fff",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <strong>{t(`auth.roles.${account.role}`)}</strong>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                {account.username} / {account.password}
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span>{t("auth.username")}</span>
            <input
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span>{t("auth.password")}</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              style={inputStyle}
            />
          </label>

          {error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              borderRadius: 16,
              background: "linear-gradient(135deg, #ff6b35, #f97316)",
              color: "#fff",
              padding: "14px 18px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {loading ? t("auth.loading") : t("auth.login")}
          </button>
        </form>
      </div>
    </section>
  );
}

function getDefaultPathByRole(role) {
  if (role === "owner") return "/owner";
  if (role === "admin") return "/admin";
  return "/map";
}

const inputStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  outline: "none",
};
