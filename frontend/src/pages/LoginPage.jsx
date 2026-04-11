import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  Input,
  Button,
  Typography,
  Space,
  Alert,
  Divider,
  Tag,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

import AuthShell from "../components/auth/AuthShell";
import { login } from "../services/authService";
import { loginSuccess } from "../store/slices/appSlice";

const { Title, Text } = Typography;

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
      badge="🚀 Smart Travel"
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footerText={t("auth.noAccount")}
      footerLinkLabel={t("auth.goRegister")}
      footerLinkTo="/register"
    >
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          
          {/* SUCCESS */}
          {successMessage && (
            <Alert type="success" message={successMessage} showIcon />
          )}

          {/* ERROR */}
          {error && <Alert type="error" message={error} showIcon />}

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder={t("auth.username")}
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
              />

              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder={t("auth.password")}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                style={{
                  height: 44,
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                {loading ? t("auth.loading") : t("auth.login")}
              </Button>
            </Space>
          </form>

          <Divider>{t("auth.demoAccounts")}</Divider>

          {/* DEMO ACCOUNTS */}
          <Space wrap>
            {demoAccounts.map((acc) => (
              <Card
                key={acc.username}
                hoverable
                size="small"
                onClick={() =>
                  setForm({
                    username: acc.username,
                    password: acc.password,
                  })
                }
                style={{
                  cursor: "pointer",
                  borderRadius: 10,
                  width: 140,
                }}
              >
                <Space direction="vertical" size={4}>
                  <Tag color="blue">
                    {t(`auth.roles.${acc.role}`)}
                  </Tag>
                  <Text strong>{acc.username}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {acc.password}
                  </Text>
                </Space>
              </Card>
            ))}
          </Space>
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