import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import { login } from "../services/authService";
import { loginSuccess } from "../store/slices/appSlice";

const demoAccounts = [
  { username: "user", password: "123456", role: "user" },
  { username: "owner_demo", password: "123456", role: "owner" },
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

  const successMessage = useMemo(
    () => location.state?.message || "",
    [location.state],
  );

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
    <AuthShell
      badge={t("auth.badge")}
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footerText={t("auth.noAccount")}
      footerLinkLabel={t("auth.goRegister")}
      footerLinkTo="/register"
    >
      <div className="auth-panel">
        <strong>{t("auth.demoAccounts")}</strong>
        {demoAccounts.map((account) => (
          <button
            key={account.role}
            type="button"
            className="auth-demo-button"
            onClick={() =>
              setForm({
                username: account.username,
                password: account.password,
              })
            }
          >
            <strong>{t(`auth.roles.${account.role}`)}</strong>
            <div className="auth-helper-text">
              {account.username} / {account.password}
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          <span>{t("auth.username")}</span>
          <input
            value={form.username}
            onChange={(event) =>
              setForm((current) => ({ ...current, username: event.target.value }))
            }
            autoComplete="username"
          />
        </label>

        <label>
          <span>{t("auth.password")}</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            autoComplete="current-password"
          />
        </label>

        {successMessage ? <p className="auth-success">{successMessage}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? t("auth.loading") : t("auth.login")}
        </button>
      </form>
    </AuthShell>
  );
}

function getDefaultPathByRole(role) {
  if (role === "owner") return "/owner";
  if (role === "admin") return "/admin";
  return "/map";
}
