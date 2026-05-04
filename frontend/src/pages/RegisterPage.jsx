import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import { register } from "../services/authService";

const INITIAL_FORM = {
  username: "",
  password: "",
  confirmPassword: "",
  displayName: "",
  email: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    try {
      setLoading(true);

      const response = await register({
        username: form.username.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        email: form.email.trim() || null,
      });

      const message = response.message || t("auth.registerSuccess");
      setSuccess(message);
      setForm(INITIAL_FORM);

      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message,
          },
        });
      }, 900);
    } catch (registerError) {
      setError(registerError.response?.data?.message || t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      badge={t("appName")}
      title={t("auth.register")}
      subtitle={t("auth.registerTitle")}
      footerText={t("auth.haveAccount")}
      footerLinkLabel={t("auth.goLogin")}
      footerLinkTo="/login"
    >
      <div className="auth-panel">
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>{t("auth.displayName")}</span>
            <input
              value={form.displayName}
              onChange={(event) =>
                setForm((current) => ({ ...current, displayName: event.target.value }))
              }
              autoComplete="name"
              required
            />
          </label>

          <div className="auth-form-row">
            <label>
              <span>{t("auth.username")}</span>
              <input
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({ ...current, username: event.target.value }))
                }
                autoComplete="username"
                required
              />
            </label>

            <label>
              <span>{t("auth.emailOptional")}</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                autoComplete="email"
              />
            </label>
          </div>

          <div className="auth-form-row">
            <label>
              <span>{t("auth.password")}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              <span>{t("auth.confirmPassword")}</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                autoComplete="new-password"
                required
              />
            </label>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}
          {success ? <p className="auth-success">{success}</p> : null}

          <button type="submit" disabled={loading} className="auth-secondary-button">
            {loading ? t("auth.registerLoading") : t("auth.register")}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
