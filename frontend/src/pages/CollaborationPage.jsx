import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { createOwnerUpgradeRequest } from "../services/authService";

import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Alert,
} from "antd";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CollaborationPage() {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.app.currentUser);

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(values) {
    setError("");
    setMessage("");

    try {
      setSubmitting(true);
      const response = await createOwnerUpgradeRequest(values);

      setMessage(response.message || t("collaboration.success"));
      form.resetFields();
    } catch (err) {
      setError(err.response?.data?.message || t("collaboration.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        
        {/* HEADER */}
        <Card style={{ borderRadius: 16 }}>
          <Space direction="vertical">
            <Title level={3} style={{ margin: 0 }}>
              {t("collaboration.title")}
            </Title>

            <Text type="secondary">
              {t("collaboration.subtitle")}
            </Text>

            {currentUser?.displayName && (
              <Text strong>
                {t("collaboration.currentUser")}: {currentUser.displayName}
              </Text>
            )}
          </Space>
        </Card>

        {/* FORM */}
        <Card style={{ borderRadius: 16 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label={t("collaboration.fields.shopName")}
              name="shopName"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Nhập tên cửa hàng" />
            </Form.Item>

            <Form.Item
              label={t("collaboration.fields.address")}
              name="addressLine"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>

            <Form.Item
              label={t("collaboration.fields.idCardImageUrl")}
              name="idCardImageUrl"
            >
              <Input placeholder="Link ảnh CCCD" />
            </Form.Item>

            <Form.Item
              label={t("collaboration.fields.businessLicenseImageUrl")}
              name="businessLicenseImageUrl"
            >
              <Input placeholder="Link giấy phép kinh doanh" />
            </Form.Item>

            <Form.Item
              label={t("collaboration.fields.note")}
              name="note"
            >
              <TextArea rows={4} placeholder="Ghi chú thêm..." />
            </Form.Item>

            {/* MESSAGE */}
            {message && (
              <Alert type="success" message={message} showIcon />
            )}

            {error && (
              <Alert type="error" message={error} showIcon />
            )}

            {/* BUTTON */}
            <Form.Item style={{ marginTop: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                block
                size="large"
              >
                {submitting
                  ? t("collaboration.submitting")
                  : t("collaboration.submit")}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
}