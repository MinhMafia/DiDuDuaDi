import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Input, Button, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

import AuthShell from "../components/auth/AuthShell";
import { login } from "../services/authService";
import { loginSuccess } from "../store/slices/appSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = useMemo(
    () => location.state?.message || "",
    [location.state],
  );

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await login(form.username, form.password);
      const session = res.data;

      dispatch(loginSuccess(session));
      localStorage.setItem("didududadi.session", JSON.stringify(session));

      const next =
        location.state?.from?.pathname ||
        getDefaultPathByRole(session.role);

      navigate(next, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      badge={t("appName")}
      title={t("auth.login")}
      subtitle={t("layout.tagline")}
      footerText={t("auth.noAccount")}
      footerLinkLabel={t("auth.goRegister")}
      footerLinkTo="/register"
    >
      <div className="auth-login-panel">
        {successMessage ? <Alert type="success" message={successMessage} showIcon /> : null}
        {error ? <Alert type="error" message={error} showIcon /> : null}

        <form onSubmit={handleSubmit} className="auth-login-form">
          <Input
            size="large"
            prefix={<UserOutlined />}
            placeholder={t("auth.username")}
            value={form.username}
            autoComplete="username"
            className="auth-login-input"
            aria-label={t("auth.username")}
            onChange={(event) =>
              setForm((current) => ({ ...current, username: event.target.value }))
            }
          />

          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            placeholder={t("auth.password")}
            value={form.password}
            autoComplete="current-password"
            className="auth-login-input"
            aria-label={t("auth.password")}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
          />

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
            className="auth-login-submit"
          >
            {loading ? t("auth.loading") : t("auth.login")}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

function getDefaultPathByRole(role) {
  if (role === "owner") return "/owner";
  if (role === "admin") return "/admin";
  return "/map";
}
