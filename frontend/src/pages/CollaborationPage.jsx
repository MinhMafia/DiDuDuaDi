import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  Card,
  Collapse,
  Empty,
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
  Popconfirm,
  Row,
  Col,
  Tabs,
} from "antd";
import {
  ShopOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  FileDoneOutlined,
  AimOutlined,
} from "@ant-design/icons";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  cancelOwnerUpgradeRequest,
  createOwnerUpgradeRequest,
  getMyOwnerUpgradeRequest,
  getMyOwnerUpgradeRequests,
  updateOwnerUpgradeRequest,
} from "../services/authService";
import "./CollaborationPage.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const DEFAULT_POSITION = { lat: 10.7587, lng: 106.7031 };

export default function CollaborationPage() {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  const [editingRequestId, setEditingRequestId] = useState(null);
  const watchedLatitude = Form.useWatch("latitude", form);
  const watchedLongitude = Form.useWatch("longitude", form);

  const latestRequestQuery = useQuery({
    queryKey: ["my-owner-upgrade-request", currentUser?.username],
    queryFn: getMyOwnerUpgradeRequest,
    enabled: Boolean(currentUser?.username),
    select: (response) => response.data,
  });

  const requestHistoryQuery = useQuery({
    queryKey: ["my-owner-upgrade-requests", currentUser?.username],
    queryFn: getMyOwnerUpgradeRequests,
    enabled: Boolean(currentUser?.username),
    select: (response) => response.data ?? [],
  });

  const latestRequest = latestRequestQuery.data;
  const requestHistory = requestHistoryQuery.data ?? [];
  const previousRequests = latestRequest
    ? requestHistory.filter((item) => item.id !== latestRequest.id)
    : requestHistory;
  const isEditingCurrentRequest = Boolean(editingRequestId);
  const canCreateNewRequest =
    !latestRequest || latestRequest.status === "rejected" || latestRequest.status === "cancelled";
  const showForm =
    !latestRequestQuery.isLoading && (canCreateNewRequest || isEditingCurrentRequest);
  const waitingAdmin = latestRequest?.status === "pending";
  const waitingPayment = latestRequest?.status === "payment_pending";
  const selectedPosition = useMemo(
    () => parseCoordinatePair(watchedLatitude, watchedLongitude),
    [watchedLatitude, watchedLongitude],
  );

  async function onFinish(values) {
    try {
      setSubmitting(true);
      const response = editingRequestId
        ? await updateOwnerUpgradeRequest(editingRequestId, values)
        : await createOwnerUpgradeRequest(values);
      antMessage.success(response.message || t(editingRequestId ? "collaboration.updateSuccess" : "collaboration.success"));
      form.resetFields();
      setEditingRequestId(null);
      await queryClient.invalidateQueries({
        queryKey: ["my-owner-upgrade-request", currentUser?.username],
      });
      await queryClient.invalidateQueries({
        queryKey: ["my-owner-upgrade-requests", currentUser?.username],
      });
      setActiveTab("history");
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        await queryClient.invalidateQueries({
          queryKey: ["my-owner-upgrade-request", currentUser?.username],
        });
        await queryClient.invalidateQueries({
          queryKey: ["my-owner-upgrade-requests", currentUser?.username],
        });
        setActiveTab("history");
      }
      antMessage.error(requestError.response?.data?.message || t("collaboration.error"));
    } finally {
      setSubmitting(false);
    }
  }

  function fillFormFromRequest(request) {
    form.setFieldsValue({
      shopName: request.shopName || "",
      addressLine: request.addressLine || "",
      latitude: request.latitude ?? "",
      longitude: request.longitude ?? "",
      idCardImageUrl: request.idCardImageUrl || "",
      businessLicenseImageUrl: request.businessLicenseImageUrl || "",
      note: request.note || "",
    });
  }

  function refillFromRequest(request) {
    fillFormFromRequest(request);
    setEditingRequestId(null);
    setActiveTab("new");
    antMessage.success(t("collaboration.prefillSuccess"));
  }

  function editPendingRequest(request) {
    fillFormFromRequest(request);
    setEditingRequestId(request.id);
    setActiveTab("new");
    antMessage.success(t("collaboration.editPendingLoaded"));
  }

  function cancelEditing() {
    form.resetFields();
    setEditingRequestId(null);
    setActiveTab("history");
  }

  async function cancelPendingRequest(requestId) {
    try {
      setCancelling(true);
      const response = await cancelOwnerUpgradeRequest(requestId);
      antMessage.success(response.message || t("collaboration.cancelSuccess"));
      form.resetFields();
      setEditingRequestId(null);
      await queryClient.invalidateQueries({
        queryKey: ["my-owner-upgrade-request", currentUser?.username],
      });
      await queryClient.invalidateQueries({
        queryKey: ["my-owner-upgrade-requests", currentUser?.username],
      });
      setActiveTab("history");
    } catch (requestError) {
      antMessage.error(requestError.response?.data?.message || t("collaboration.cancelError"));
    } finally {
      setCancelling(false);
    }
  }

  function handleMapSelect(position) {
    form.setFieldsValue({
      latitude: Number(position.lat.toFixed(6)),
      longitude: Number(position.lng.toFixed(6)),
    });
  }

  const getStatusTag = (status) => {
    switch (status) {
      case "pending":
        return <Tag color="blue">{t("collaboration.status.pending")}</Tag>;
      case "payment_pending":
        return <Tag color="warning">{t("collaboration.status.paymentPending")}</Tag>;
      case "approved":
        return <Tag color="success">{t("collaboration.status.approved")}</Tag>;
      case "rejected":
        return <Tag color="error">{t("collaboration.status.rejected")}</Tag>;
      case "cancelled":
        return <Tag color="default">{t("collaboration.status.cancelled")}</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const historyItems = previousRequests.map((request) => ({
    key: String(request.id),
    label: (
      <div className="collaboration-history-head">
        <div>
          <strong>{request.shopName}</strong>
          <div className="collaboration-history-subtitle">
            {request.addressLine}
          </div>
        </div>
        <Space size={8} wrap>
          {getStatusTag(request.status)}
          <Text type="secondary">
            {formatDateTime(request.submittedAt, i18n.language)}
          </Text>
        </Space>
      </div>
    ),
    children: (
      <div className="collaboration-history-body">
        <Descriptions
          bordered
          size="small"
          column={1}
          className="collaboration-history-descriptions"
        >
          <Descriptions.Item label={t("collaboration.fields.shopName")}>
            {request.shopName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("collaboration.fields.address")}>
            {request.addressLine || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("collaboration.fields.latitude")}>
            {formatCoordinate(request.latitude)}
          </Descriptions.Item>
          <Descriptions.Item label={t("collaboration.fields.longitude")}>
            {formatCoordinate(request.longitude)}
          </Descriptions.Item>
          <Descriptions.Item label={t("collaboration.fields.note")}>
            {request.note || t("collaboration.emptyNote")}
          </Descriptions.Item>
          <Descriptions.Item label={t("collaboration.history.submittedAt")}>
            {formatDateTime(request.submittedAt, i18n.language)}
          </Descriptions.Item>
          <Descriptions.Item label={t("collaboration.history.reviewedAt")}>
            {formatDateTime(request.reviewedAt, i18n.language)}
          </Descriptions.Item>
          <Descriptions.Item label={t("collaboration.history.reviewResult")}>
            {request.reviewNote || t("collaboration.history.noReviewReason")}
          </Descriptions.Item>
        </Descriptions>

        <div className="collaboration-history-links">
          {request.status === "rejected" ? (
            <Button
              type="primary"
              ghost
              onClick={() => refillFromRequest(request)}
            >
              {t("collaboration.history.editFromOld")}
            </Button>
          ) : null}

          {request.idCardImageUrl ? (
            <a
              href={request.idCardImageUrl}
              target="_blank"
              rel="noreferrer"
              className="collaboration-history-link"
            >
              {t("collaboration.history.viewIdCard")}
            </a>
          ) : null}

          {request.businessLicenseImageUrl ? (
            <a
              href={request.businessLicenseImageUrl}
              target="_blank"
              rel="noreferrer"
              className="collaboration-history-link"
            >
              {t("collaboration.history.viewBusinessLicense")}
            </a>
          ) : null}
        </div>
      </div>
    ),
  }));

  return (
    <div className="collaboration-page-shell">
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

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="collaboration-tabs"
        items={[
          {
            key: "new",
            label: t("collaboration.tabs.new"),
            children: (
              <>
                {latestRequestQuery.isLoading ? (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <Spin size="large" tip={t("common.loading")} />
                  </div>
                ) : null}

                {latestRequestQuery.error ? (
                  <Alert
                    message={t("collaboration.error")}
                    description={latestRequestQuery.error.message}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                ) : null}

                {!showForm && latestRequest ? (
                  <Card
                    title={t("collaboration.formLockedTitle")}
                    extra={getStatusTag(latestRequest.status)}
                    style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  >
                    <Alert
                      type={waitingPayment ? "warning" : "info"}
                      showIcon
                      message={t("collaboration.formLockedMessage")}
                      description={t("collaboration.formLockedDescription")}
                    />
                  </Card>
                ) : null}

                {showForm ? (
                  <Card
                    title={t(editingRequestId ? "collaboration.editFormTitle" : "collaboration.formTitle")}
                    style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  >
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={onFinish}
                      autoComplete="off"
                      requiredMark={false}
                    >
                      <Form.Item
                        label={t("collaboration.fields.shopName")}
                        name="shopName"
                        rules={[{ required: true, message: t("collaboration.validation.shopNameRequired") }]}
                      >
                        <Input
                          prefix={<ShopOutlined />}
                          placeholder={t("collaboration.placeholders.shopName")}
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label={t("collaboration.fields.address")}
                        name="addressLine"
                        rules={[{ required: true, message: t("collaboration.validation.addressRequired") }]}
                      >
                        <Input
                          prefix={<EnvironmentOutlined />}
                          placeholder={t("collaboration.placeholders.address")}
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label={t("collaboration.mapPicker.title")}
                        extra={t("collaboration.mapPicker.hint")}
                      >
                        <div className="collaboration-map-picker">
                          <div className="collaboration-map-picker-toolbar">
                            <Space size={8} wrap>
                              <Tag color="blue" icon={<AimOutlined />}>
                                {t("collaboration.mapPicker.selectedCoordinates", {
                                  lat: formatCoordinate(selectedPosition?.lat),
                                  lng: formatCoordinate(selectedPosition?.lng),
                                })}
                              </Tag>
                            </Space>
                          </div>

                          <div className="collaboration-map-canvas">
                            <LocationPickerMap
                              selectedPosition={selectedPosition}
                              onSelect={handleMapSelect}
                            />
                          </div>
                        </div>
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={t("collaboration.fields.latitude")}
                            name="latitude"
                            rules={[{ required: true, message: t("collaboration.validation.latitudeRequired") }]}
                          >
                            <Input
                              type="number"
                              step="any"
                              placeholder={t("collaboration.placeholders.latitude")}
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={t("collaboration.fields.longitude")}
                            name="longitude"
                            rules={[{ required: true, message: t("collaboration.validation.longitudeRequired") }]}
                          >
                            <Input
                              type="number"
                              step="any"
                              placeholder={t("collaboration.placeholders.longitude")}
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label={t("collaboration.fields.idCardImageUrl")}
                        name="idCardImageUrl"
                      >
                        <Input prefix={<IdcardOutlined />} placeholder="https://..." size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t("collaboration.fields.businessLicenseImageUrl")}
                        name="businessLicenseImageUrl"
                      >
                        <Input prefix={<FileDoneOutlined />} placeholder="https://..." size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t("collaboration.fields.note")}
                        name="note"
                      >
                        <TextArea rows={4} placeholder={t("collaboration.placeholders.note")} />
                      </Form.Item>

                      <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                        <Space direction="vertical" style={{ width: "100%" }} size={12}>
                          <Button type="primary" htmlType="submit" size="large" loading={submitting} block>
                            {submitting
                              ? t("collaboration.submitting")
                              : t(editingRequestId ? "collaboration.updateSubmit" : "collaboration.submit")}
                          </Button>
                          {editingRequestId ? (
                            <Button size="large" onClick={cancelEditing} block>
                              {t("collaboration.cancelEdit")}
                            </Button>
                          ) : null}
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                ) : null}
              </>
            ),
          },
          {
            key: "history",
            label: t("collaboration.tabs.history"),
            children: (
              <>
                {latestRequest && (
                  <Card
                    title={t("collaboration.latestRequestTitle")}
                    extra={getStatusTag(latestRequest.status)}
                    style={{ marginBottom: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  >
                    <Title level={5}>
                      {latestRequest.shopName} - <Text type="secondary" style={{ fontSize: 14 }}>{latestRequest.addressLine}</Text>
                    </Title>

                    {latestRequest.reviewNote && (
                      <Alert
                        message={`${t("collaboration.reviewNote")}: ${latestRequest.reviewNote}`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}

                    {waitingAdmin && (
                      <Alert
                        message={t("collaboration.waitingReviewTitle")}
                        description={t("collaboration.waitingReviewDescription")}
                        type="info"
                        showIcon
                      />
                    )}

                    {waitingAdmin ? (
                      <Space wrap style={{ marginTop: 16 }}>
                        <Button type="primary" ghost onClick={() => editPendingRequest(latestRequest)}>
                          {t("collaboration.editPending")}
                        </Button>
                        <Popconfirm
                          title={t("collaboration.cancelPendingTitle")}
                          description={t("collaboration.cancelPendingDescription")}
                          okText={t("collaboration.confirmCancel")}
                          cancelText={t("collaboration.keepPending")}
                          onConfirm={() => cancelPendingRequest(latestRequest.id)}
                        >
                          <Button danger loading={cancelling}>
                            {t("collaboration.cancelPending")}
                          </Button>
                        </Popconfirm>
                      </Space>
                    ) : null}

                    {waitingPayment && (
                      <Card type="inner" title={t("collaboration.paymentTitle")} style={{ marginTop: 16 }}>
                        <Alert
                          description={t("collaboration.paymentDescription")}
                          type="warning"
                          showIcon
                          style={{ marginBottom: 24 }}
                        />

                        <Row gutter={[24, 24]}>
                          <Col xs={24} md={14}>
                            <Descriptions column={1} bordered size="small">
                              <Descriptions.Item label={t("collaboration.feeAmount")}>
                                <Text type="danger" strong>{formatCurrency(latestRequest.upgradeFeeAmount)}</Text>
                              </Descriptions.Item>
                              <Descriptions.Item label={t("collaboration.paymentReference")}>
                                <Text copyable strong>{latestRequest.paymentReferenceCode || "-"}</Text>
                              </Descriptions.Item>
                              <Descriptions.Item label={t("collaboration.fields.latitude")}>
                                {formatCoordinate(latestRequest.latitude)}
                              </Descriptions.Item>
                              <Descriptions.Item label={t("collaboration.fields.longitude")}>
                                {formatCoordinate(latestRequest.longitude)}
                              </Descriptions.Item>
                              <Descriptions.Item label={t("collaboration.paymentRequestedAt")}>
                                {formatDateTime(latestRequest.paymentRequestedAt, i18n.language)}
                              </Descriptions.Item>
                            </Descriptions>

                            {latestRequest.paymentQrContent && (
                              <div style={{ marginTop: 16 }}>
                                <Text strong>{t("collaboration.transferMemo")}: </Text>
                                <Paragraph copyable style={{ background: "#f5f5f5", padding: "8px 12px", borderRadius: 4, marginTop: 8 }}>
                                  <code>{latestRequest.paymentQrContent}</code>
                                </Paragraph>
                              </div>
                            )}
                          </Col>

                          <Col xs={24} md={10} style={{ textAlign: "center" }}>
                            <Text strong style={{ display: "block", marginBottom: 12 }}>
                              {t("collaboration.qrLabel")}
                            </Text>
                            {latestRequest.paymentQrImageUrl ? (
                              <Image
                                src={latestRequest.paymentQrImageUrl}
                                alt="Payment QR"
                                width={200}
                                style={{ borderRadius: 8, border: "1px solid #d9d9d9", padding: 8 }}
                              />
                            ) : (
                              <Alert message={t("collaboration.qrUnavailable")} type="error" />
                            )}
                          </Col>
                        </Row>
                      </Card>
                    )}

                    {latestRequest.status === "rejected" ? (
                      <Alert
                        message={t("collaboration.rejectedTitle")}
                        description={t("collaboration.rejectedDescription")}
                        type="error"
                        showIcon
                        style={{ marginTop: 16, marginBottom: 16 }}
                      />
                    ) : null}

                    {latestRequest.status === "rejected" ? (
                      <Button type="primary" onClick={() => refillFromRequest(latestRequest)}>
                        {t("collaboration.history.editFromOld")}
                      </Button>
                    ) : null}
                  </Card>
                )}

                <Card
                  title={t("collaboration.history.title")}
                  extra={
                    <Text type="secondary">
                      {t("collaboration.history.count", { count: previousRequests.length })}
                    </Text>
                  }
                  style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                >
                  {requestHistoryQuery.isLoading ? (
                    <div style={{ textAlign: "center", padding: 24 }}>
                      <Spin tip={t("common.loading")} />
                    </div>
                  ) : previousRequests.length === 0 ? (
                    <Empty description={t("collaboration.history.empty")} />
                  ) : (
                    <Collapse
                      accordion
                      items={historyItems}
                      className="collaboration-history-collapse"
                    />
                  )}
                </Card>
              </>
            ),
          },
        ]}
      />
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

function formatDateTime(value, language = "vi") {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function parseCoordinatePair(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return DEFAULT_POSITION;
  }

  return { lat, lng };
}

function LocationPickerMap({ selectedPosition, onSelect }) {
  return (
    <MapContainer
      center={selectedPosition ?? DEFAULT_POSITION}
      zoom={17}
      scrollWheelZoom
      className="collaboration-map-leaflet"
    >
      <MapViewUpdater center={selectedPosition ?? DEFAULT_POSITION} />
      <MapClickHandler onSelect={onSelect} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={22}
      />
      {selectedPosition ? (
        <CircleMarker
          center={selectedPosition}
          radius={10}
          pathOptions={{
            color: "#1d4ed8",
            fillColor: "#2563eb",
            fillOpacity: 0.95,
            weight: 2,
          }}
        />
      ) : null}
    </MapContainer>
  );
}

function MapViewUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    map.setView(center);
  }, [center, map]);

  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect?.(event.latlng);
    },
  });

  return null;
}
