import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  Card,
  Form,
  Input,
  Button,
  Tag,
  Alert,
  Descriptions,
  Typography,
  Space,
  Spin,
  Image,
  message as antMessage,
  Row,
  Col,
} from "antd";
import {
  ShopOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  IdcardOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import { createOwnerUpgradeRequest, getMyOwnerUpgradeRequest } from "../services/authService";
// Bạn có thể giữ lại file CSS để tuỳ chỉnh thêm nếu cần, hoặc bỏ đi vì antd đã bao phủ phần lớn styling.
// import "./CollaborationPage.css"; 

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function CollaborationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);
  
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const latestRequestQuery = useQuery({
    queryKey: ["my-owner-upgrade-request", currentUser?.username],
    queryFn: getMyOwnerUpgradeRequest,
    enabled: Boolean(currentUser?.username),
    select: (response) => response.data,
  });

  const latestRequest = latestRequestQuery.data;
  const showForm = !latestRequest || latestRequest.status === "rejected";
  const waitingAdmin = latestRequest?.status === "pending";
  const waitingPayment = latestRequest?.status === "payment_pending";

  async function onFinish(values) {
    try {
      setSubmitting(true);
      const response = await createOwnerUpgradeRequest(values);
      antMessage.success(response.message || t("collaboration.success"));
      form.resetFields();
      await queryClient.invalidateQueries({
        queryKey: ["my-owner-upgrade-request", currentUser?.username],
      });
    } catch (requestError) {
      antMessage.error(requestError.response?.data?.message || t("collaboration.error"));
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusTag = (status) => {
    switch (status) {
      case "pending":
        return <Tag color="blue">{t("collaboration.status.pending", "Đang chờ duyệt")}</Tag>;
      case "payment_pending":
        return <Tag color="warning">{t("collaboration.status.paymentPending", "Chờ thanh toán")}</Tag>;
      case "approved":
        return <Tag color="success">{t("collaboration.status.approved", "Đã kích hoạt")}</Tag>;
      case "rejected":
        return <Tag color="error">{t("collaboration.status.rejected", "Bị từ chối")}</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
      {/* Header Section */}
      <Card bordered={false} style={{ marginBottom: 24, background: "linear-gradient(to right, #f0f2f5, #ffffff)" }}>
        <Title level={2} style={{ marginTop: 0, color: "#1890ff" }}>
          <ShopOutlined style={{ marginRight: 12 }} />
          {t("collaboration.title")}
        </Title>
        <Text type="secondary">{t("collaboration.subtitle")}</Text>
        {currentUser?.displayName && (
          <div style={{ marginTop: 16 }}>
            <Text strong>
              {t("collaboration.currentUser")}: <Text type="success">{currentUser.displayName}</Text>
            </Text>
          </div>
        )}
      </Card>

      {/* Loading & Error States */}
      {latestRequestQuery.isLoading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" tip={t("common.loading", "Đang tải dữ liệu...")} />
        </div>
      )}

      {latestRequestQuery.error && (
        <Alert
          message={t("collaboration.error")}
          description={latestRequestQuery.error.message}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Latest Request Details */}
      {latestRequest && (
        <Card 
          title={t("collaboration.latestRequestTitle", "Yêu cầu gần nhất")} 
          extra={getStatusTag(latestRequest.status)}
          style={{ marginBottom: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
        >
          <Title level={5}>
            {latestRequest.shopName} - <Text type="secondary" style={{ fontSize: 14 }}>{latestRequest.addressLine}</Text>
          </Title>

          {latestRequest.reviewNote && (
            <Alert
              message={`${t("collaboration.reviewNote", "Ghi chú từ admin")}: ${latestRequest.reviewNote}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {waitingAdmin && (
            <Alert
              message={t("collaboration.waitingReviewTitle", "Hồ sơ đang chờ admin duyệt")}
              description={t("collaboration.waitingReviewDescription", "Khi admin đồng ý, hệ thống sẽ phát sinh mã QR thanh toán phí nâng quyền trước khi kích hoạt tài khoản chủ quán.")}
              type="info"
              showIcon
            />
          )}

          {waitingPayment && (
            <Card type="inner" title={t("collaboration.paymentTitle", "Thanh toán phí nâng quyền")} style={{ marginTop: 16 }}>
              <Alert
                description={t("collaboration.paymentDescription", "Admin đã duyệt sơ bộ. Hãy quét mã QR để thanh toán, sau đó admin sẽ xác nhận và kích hoạt quyền chủ quán.")}
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Row gutter={[24, 24]}>
                <Col xs={24} md={14}>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label={t("collaboration.feeAmount", "Phí nâng quyền")}>
                      <Text type="danger" strong>{formatCurrency(latestRequest.upgradeFeeAmount)}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t("collaboration.paymentReference", "Mã chuyển khoản")}>
                      <Text copyable strong>{latestRequest.paymentReferenceCode || "-"}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t("collaboration.fields.latitude")}>
                      {formatCoordinate(latestRequest.latitude)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("collaboration.fields.longitude")}>
                      {formatCoordinate(latestRequest.longitude)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("collaboration.paymentRequestedAt", "Thời điểm tạo QR")}>
                      {latestRequest.paymentRequestedAt ? new Date(latestRequest.paymentRequestedAt).toLocaleString() : "-"}
                    </Descriptions.Item>
                  </Descriptions>

                  {latestRequest.paymentQrContent && (
                    <div style={{ marginTop: 16 }}>
                      <Text strong>{t("collaboration.transferMemo", "Nội dung thanh toán")}: </Text>
                      <Paragraph copyable style={{ background: "#f5f5f5", padding: "8px 12px", borderRadius: 4, marginTop: 8 }}>
                        <code>{latestRequest.paymentQrContent}</code>
                      </Paragraph>
                    </div>
                  )}
                </Col>
                
                <Col xs={24} md={10} style={{ textAlign: "center" }}>
                  <Text strong style={{ display: "block", marginBottom: 12 }}>
                    {t("collaboration.qrLabel", "Mã QR thanh toán")}
                  </Text>
                  {latestRequest.paymentQrImageUrl ? (
                    <Image
                      src={latestRequest.paymentQrImageUrl}
                      alt="Payment QR"
                      width={200}
                      style={{ borderRadius: 8, border: "1px solid #d9d9d9", padding: 8 }}
                    />
                  ) : (
                    <Alert message={t("collaboration.qrUnavailable", "QR chưa sẵn sàng. Vui lòng liên hệ admin.")} type="error" />
                  )}
                </Col>
              </Row>
            </Card>
          )}

          {latestRequest.status === "rejected" && (
            <Alert
              message={t("collaboration.rejectedTitle", "Yêu cầu trước đã bị từ chối")}
              description={t("collaboration.rejectedDescription", "Bạn có thể chỉnh lại thông tin và gửi lại một yêu cầu mới ở form bên dưới.")}
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      )}

      {/* Collaboration Form */}
      {showForm && (
        <Card 
          title={t("collaboration.formTitle", "Đăng ký thông tin cửa hàng")} 
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            requiredMark="optional"
          >
            <Form.Item
              label={t("collaboration.fields.shopName", "Tên cửa hàng")}
              name="shopName"
              rules={[{ required: true, message: t("common.required", "Vui lòng nhập tên cửa hàng!") }]}
            >
              <Input prefix={<ShopOutlined />} placeholder="Ví dụ: Cà phê Mùa Thu" size="large" />
            </Form.Item>

            <Form.Item
              label={t("collaboration.fields.address", "Địa chỉ")}
              name="addressLine"
              rules={[{ required: true, message: t("common.required", "Vui lòng nhập địa chỉ!") }]}
            >
              <Input prefix={<EnvironmentOutlined />} placeholder="Số nhà, đường, phường/xã..." size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={t("collaboration.fields.latitude", "Vĩ độ")}
                  name="latitude"
                  rules={[{ required: true, message: t("common.required", "Bắt buộc!") }]}
                >
                  <Input type="number" step="any" placeholder="Ví dụ: 10.762622" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={t("collaboration.fields.longitude", "Kinh độ")}
                  name="longitude"
                  rules={[{ required: true, message: t("common.required", "Bắt buộc!") }]}
                >
                  <Input type="number" step="any" placeholder="Ví dụ: 106.660172" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={t("collaboration.fields.idCardImageUrl", "Link ảnh CMND/CCCD")}
              name="idCardImageUrl"
            >
              <Input prefix={<IdcardOutlined />} placeholder="https://..." size="large" />
            </Form.Item>

            <Form.Item
              label={t("collaboration.fields.businessLicenseImageUrl", "Link ảnh Giấy phép kinh doanh")}
              name="businessLicenseImageUrl"
            >
              <Input prefix={<FileDoneOutlined />} placeholder="https://..." size="large" />
            </Form.Item>

            <Form.Item
              label={t("collaboration.fields.note", "Ghi chú")}
              name="note"
            >
              <TextArea rows={4} placeholder="Nhập ghi chú thêm cho admin (nếu có)" />
            </Form.Item>

            <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" size="large" loading={submitting} block>
                {submitting ? t("collaboration.submitting", "Đang gửi...") : t("collaboration.submit", "Gửi yêu cầu")}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatCoordinate(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : String(value);
}