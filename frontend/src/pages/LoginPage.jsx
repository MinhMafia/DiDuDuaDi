import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  Input,
  Button,
  Space,
  Alert,
  Typography,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

import AuthShell from "../components/auth/AuthShell";
import { login } from "../services/authService";
import { loginSuccess } from "../store/slices/appSlice";

const { Text } = Typography;

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
      badge={t("auth.badge")}
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footerText={t("auth.noAccount")}
      footerLinkLabel={t("auth.goRegister")}
      footerLinkTo="/register"
    >
      <Card
        style={{
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 48px rgba(15,23,42,0.08)",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
        }}
        bodyStyle={{ padding: 28 }}
      >
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          {successMessage && (
            <Alert type="success" message={successMessage} showIcon />
          )}

          {error && <Alert type="error" message={error} showIcon />}

          <form onSubmit={handleSubmit}>
            <Space direction="vertical" style={{ width: "100%" }} size={14}>
              <div>
                <Text
                  strong
                  style={{ display: "block", marginBottom: 8, color: "#0f172a" }}
                >
                  {t("auth.username")}
                </Text>
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder={t("auth.username")}
                  value={form.username}
                  autoComplete="username"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                  style={{ borderRadius: 14, height: 48 }}
                />
              </div>

              <div>
                <Text
                  strong
                  style={{ display: "block", marginBottom: 8, color: "#0f172a" }}
                >
                  {t("auth.password")}
                </Text>
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder={t("auth.password")}
                  value={form.password}
                  autoComplete="current-password"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  style={{ borderRadius: 14, height: 48 }}
                />
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                style={{
                  height: 50,
                  borderRadius: 14,
                  fontWeight: 700,
                  marginTop: 6,
                  boxShadow: "0 12px 24px rgba(37, 99, 235, 0.24)",
                }}
              >
                {loading ? t("auth.loading") : t("auth.login")}
              </Button>
            </Space>
          </form>
        </Space>
      </Card>
    </AuthShell>
  );
}

function getDefaultPathByRole(role) {
  if (role === "owner") return "/owner";
  if (role === "admin") return "/admin";
  return "/map";
}
