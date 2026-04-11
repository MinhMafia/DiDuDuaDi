 import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  Card,
  Button,
  Input,
  Typography,
  Space,
  Tag,
  Spin,
  Row,
  Col,
  Empty,
  Table,
  Modal,
  Form,
  Tabs,
  message,
} from "antd";

import {
  getOwnerUpgradeRequests,
  getShopIntroReviews,
  reviewOwnerUpgradeRequest,
  reviewShopIntro,
} from "../services/adminService";

import {
  getTopShops,
  getTopPois,
  getPois,
  createPoi,
  updatePoi,
  deletePoi,
} from "../services/analyticsService";


const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.app.currentUser);
  const queryClient = useQueryClient();

  const [ownerReviewNotes, setOwnerReviewNotes] = useState({});
  const [introReviewNotes, setIntroReviewNotes] = useState({});

  // Stats states
  const [statsPeriod, setStatsPeriod] = useState('30');
  const [statsMetric, setStatsMetric] = useState('visits');

  // POI manage
  const [poiModalVisible, setPoiModalVisible] = useState(false);
  const [editingPoi, setEditingPoi] = useState(null);
  const [poiSearch, setPoiSearch] = useState('');

  const periods = ['7', '30', '90'];
  const metrics = ['visits', 'audio'];

const shopsColumns = [
  { 
    title: 'Quán', 
    dataIndex: 'name', 
    render: (text) => <strong>{text}</strong> 
  },
  { 
    title: 'Slug', 
    dataIndex: 'slug' 
  },
  {
    title: 'Vị trí',
    render: (_, record) => {
      const lat = Number(record?.lat);
      const lng = Number(record?.lng);

      if (isNaN(lat) || isNaN(lng)) return "N/A";

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  },
  { 
    title: 'Lượt', 
    dataIndex: 'count',
    sorter: (a, b) => a.count - b.count 
  },
  { 
    title: 'Chỉ số', 
    dataIndex: 'metric' 
  },
];
// --- BỘ CỘT CHO TOP POI (THỐNG KÊ) ---
const topPoisColumns = [
  { 
    title: 'Tên địa điểm', 
    render: (_, record) => (
      <strong>{record.name || record.Name || record.shopName || "N/A"}</strong>
    )
  },
  { 
    title: 'ID', 
    render: (_, record) => <Tag>{(record.id || record.Id || "").slice(-8)}</Tag>
  },
  {
    title: 'Vị trí',
    render: (_, record) => {
      const lat = record.lat ?? record.location?.lat;
      const lng = record.lng ?? record.location?.lng;
      return lat ? `${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}` : "N/A";
    }
  },
  { 
    title: 'Lượt tương tác', 
    dataIndex: 'count',
    sorter: (a, b) => a.count - b.count,
    render: (count) => <Tag color="orange" style={{ fontWeight: 'bold' }}>{count} lượt</Tag>
  },
  { 
    title: 'Chỉ số', 
    dataIndex: 'metric',
    render: (m) => <Tag color="purple">{m}</Tag>
  },
];

// --- BỘ CỘT CHO QUẢN LÝ POI (FULL THÔNG TIN) ---
const managePoisColumns = [
  { 
    title: 'Tên', 
    render: (_, record) => {
      const nameObj = record.name || {};
      return <strong>{nameObj.vi || nameObj.en || record.shopName || "N/A"}</strong>;
    }
  },
  {
    title: 'Danh mục',
    dataIndex: 'category',
    render: (cat) => <Tag color="blue">{cat || 'street_food'}</Tag>
  },
  {
    title: 'Địa chỉ',
    dataIndex: 'shopAddress',
    ellipsis: true,
    width: 200,
  },
  {
    title: 'Thông số',
    render: (_, record) => (
      <Space direction="vertical" size={0}>
        <small>📍 {record.lat}, {record.lng}</small>
        <small>🎯 Bán kính: {record.radius}m</small>
      </Space>
    )
  },
  {
    title: 'Menu',
    dataIndex: 'menuItems',
    render: (menu) => (
      <Tag color={menu?.length > 0 ? "green" : "default"}>
        {menu?.length || 0} món
      </Tag>
    )
  }
];
const poisColumns = [
  { 
    title: 'Tên', 
    dataIndex: 'name',
    render: (name, record) => {
      // Ưu tiên hiển thị displayName (đã map ở useQuery) hoặc shopName
      if (record.displayName) return <strong>{record.displayName}</strong>;
      if (record.shopName) return <strong>{record.shopName}</strong>;
      
      if (!name) return "Không có tên";
      return name.vi || name.en || Object.values(name)[0] || "Không có tên";
    }
  },
  { 
    title: 'ID', 
    dataIndex: 'id', 
    render: (id) => id?.slice?.(-8) || "N/A"
  },
  {
    title: 'Danh mục',
    dataIndex: 'category',
    render: (category) => category ? <Tag color="blue">{category}</Tag> : "N/A"
  },
  {
    title: 'Địa chỉ',
    dataIndex: 'shopAddress',
    render: (address) => address || "Chưa cập nhật",
    ellipsis: true, // Thêm ellipsis để tránh địa chỉ quá dài làm vỡ bảng
  },
  {
    title: 'Vị trí',
    render: (_, record) => {
      // Lấy từ biến đã map (lat/lng) hoặc lấy trực tiếp từ object location
      const lat = record?.lat ?? record?.location?.lat;
      const lng = record?.lng ?? record?.location?.lng;

      if (lat == null || lng == null) return "Không có tọa độ";

      return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
    }
  },
  {
    title: 'Bán kính',
    dataIndex: 'radius',
    render: (radius) => radius ? `${radius}m` : "N/A"
  },
  {
    title: 'Thực đơn',
    dataIndex: 'menuItems',
    render: (menuItems) => menuItems?.length ? <Tag color="green">{menuItems.length} món</Tag> : "Trống"
  }
];

  // ================= QUERY =================
  const pendingOwnerRequestsQuery = useQuery({

    queryKey: ["owner-upgrade-requests", "pending"],
    queryFn: () => getOwnerUpgradeRequests("pending"),
    select: (res) => res.data ?? [],
  });

  const reviewedOwnerRequestsQuery = useQuery({
    queryKey: ["owner-upgrade-requests", "reviewed"],
    queryFn: async () => {
      const [approved, rejected] = await Promise.all([
        getOwnerUpgradeRequests("approved"),
        getOwnerUpgradeRequests("rejected"),
      ]);
      return [...(approved.data ?? []), ...(rejected.data ?? [])];
    },
  });

  const pendingIntroReviewsQuery = useQuery({
    queryKey: ["shop-intro-reviews", "pending"],
    queryFn: () => getShopIntroReviews("pending"),
    select: (res) => res.data ?? [],
  });

  const reviewedIntroReviewsQuery = useQuery({
    queryKey: ["shop-intro-reviews", "reviewed"],
    queryFn: async () => {
      const [approved, rejected] = await Promise.all([
        getShopIntroReviews("approved"),
        getShopIntroReviews("rejected"),
      ]);
      return [...(approved.data ?? []), ...(rejected.data ?? [])];
    },
  });

  // ================= MUTATION =================
  const ownerReviewMutation = useMutation({
    mutationFn: ({ requestId, action, reason }) =>
      reviewOwnerUpgradeRequest(requestId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-upgrade-requests"] });
    },
  });

  const introReviewMutation = useMutation({
    mutationFn: ({ shopId, action, reason }) =>
      reviewShopIntro(shopId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-intro-reviews"] });
    },
  });

  // Stats queries
const topShopsQuery = useQuery({
  queryKey: ['topShops', statsPeriod, statsMetric],
  queryFn: () => getTopShops(parseInt(statsPeriod), 10, statsMetric),
  enabled: !!(statsPeriod && statsMetric),
select: (res) => {
  console.log("RAW RES:", res);

  if (Array.isArray(res)) return res; // 🔥 QUAN TRỌNG

  if (Array.isArray(res?.data)) return res.data;

  if (Array.isArray(res?.data?.items)) return res.data.items;

  return [];
}
});
const chartTopShops = (topShopsQuery.data || []).map(item => ({
  name: item.name,
  lượt: item.count || 0,
}));
const topPoisQuery = useQuery({
  queryKey: ['topPois', statsPeriod, statsMetric],
  queryFn: () => getTopPois(parseInt(statsPeriod), 10, statsMetric),
  enabled: !!(statsPeriod && statsMetric),
  select: (res) => {
    console.log("TOP POIS:", res);

    return Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.items)
      ? res.data.items
      : [];
  },
});

const poisQuery = useQuery({
  queryKey: ['pois'],
  queryFn: () => getPois(),
  select: (res) => {
    const data = res.data ?? [];
console.log(data)
    return data.map(p => ({
      ...p,
      lat: p.location?.lat,
      lng: p.location?.lng,
      displayName:
        p.name?.vi ||
        p.name?.en ||
        Object.values(p.name || {})[0],
    }));
  },
});

  const poiCreateMutation = useMutation({
    mutationFn: createPoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      message.success('Tạo POI thành công');
    },
  });

const poiUpdateMutation = useMutation({
  mutationFn: ({ id, data }) => updatePoi(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['pois'] });
    message.success('Cập nhật POI thành công');
  },
});

  const poiDeleteMutation = useMutation({
    mutationFn: deletePoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      message.success('Xóa POI thành công');
    },
  });


  // ================= RENDER =================
  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      
      {/* HEADER */}
      <Card style={{ borderRadius: 16 }}>
        <Space direction="vertical">
          <Title level={3}>{t("admin.title")}</Title>
          <Text type="secondary">{t("admin.subtitle")}</Text>
          <Tag color="blue">{currentUser?.displayName}</Tag>
        </Space>
      </Card>

      {/* OWNER REQUESTS */}
      <Card
        title={t("admin.ownerRequestsTitle")}
        extra={<Tag color="orange">Pending</Tag>}
        style={{ borderRadius: 16 }}
      >
        {pendingOwnerRequestsQuery.isLoading ? (
          <Spin />
        ) : pendingOwnerRequestsQuery.data.length === 0 ? (
          <Empty description={t("admin.emptyPendingOwnerRequests")} />
        ) : (
          <Row gutter={[16, 16]}>
            {pendingOwnerRequestsQuery.data.map((request) => (
              <Col xs={24} md={12} lg={8} key={request.id}>
                <Card style={{ borderRadius: 12 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Title level={5}>{request.shopName}</Title>

                    <Text type="secondary">
                      👤 {request.username} - {request.displayName}
                    </Text>

                    <Text type="secondary">
                      📍 {request.addressLine}
                    </Text>

                    {request.note && <Text>📝 {request.note}</Text>}

                    <TextArea
                      placeholder={t("admin.reviewNotePlaceholder")}
                      autoSize={{ minRows: 2 }}
                      value={ownerReviewNotes[request.id] || ""}
                      onChange={(e) =>
                        setOwnerReviewNotes((prev) => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))
                      }
                    />

                    <Space>
                      <Button
                        type="primary"
                        loading={ownerReviewMutation.isPending}
                        onClick={() =>
                          ownerReviewMutation.mutate({
                            requestId: request.id,
                            action: "approve",
                            reason: ownerReviewNotes[request.id],
                          })
                        }
                      >
                        Approve
                      </Button>

                      <Button
                        danger
                        loading={ownerReviewMutation.isPending}
                        onClick={() =>
                          ownerReviewMutation.mutate({
                            requestId: request.id,
                            action: "reject",
                            reason: ownerReviewNotes[request.id],
                          })
                        }
                      >
                        Reject
                      </Button>
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* SHOP INTRO */}
      <Card
        title={t("admin.shopIntroTitle")}
        extra={<Tag color="purple">Review</Tag>}
        style={{ borderRadius: 16 }}
      >
        {pendingIntroReviewsQuery.isLoading ? (
          <Spin />
        ) : pendingIntroReviewsQuery.data.length === 0 ? (
          <Empty description={t("admin.emptyPendingShopIntros")} />
        ) : (
          <Row gutter={[16, 16]}>
            {pendingIntroReviewsQuery.data.map((item) => (
              <Col xs={24} md={12} lg={8} key={item.shopId}>
                <Card style={{ borderRadius: 12 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Title level={5}>{item.shopName}</Title>

                    <Text type="secondary">
                      👤 {item.ownerDisplayName}
                    </Text>

                    <Text type="secondary">
                      📍 {item.addressLine}
                    </Text>

                    <Text>
                      <b>Pending:</b> {item.pendingIntroduction}
                    </Text>

                    <TextArea
                      placeholder="Review note..."
                      autoSize={{ minRows: 2 }}
                      value={introReviewNotes[item.shopId] || ""}
                      onChange={(e) =>
                        setIntroReviewNotes((prev) => ({
                          ...prev,
                          [item.shopId]: e.target.value,
                        }))
                      }
                    />

                    <Space>
                      <Button
                        type="primary"
                        loading={introReviewMutation.isPending}
                        onClick={() =>
                          introReviewMutation.mutate({
                            shopId: item.shopId,
                            action: "approve",
                            reason: introReviewNotes[item.shopId],
                          })
                        }
                      >
                        Approve
                      </Button>

                      <Button
                        danger
                        loading={introReviewMutation.isPending}
                        onClick={() =>
                          introReviewMutation.mutate({
                            shopId: item.shopId,
                            action: "reject",
                            reason: introReviewNotes[item.shopId],
                          })
                        }
                      >
                        Reject
                      </Button>
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* HISTORY */}
      <Card title={t("admin.reviewHistoryTitle")} style={{ borderRadius: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Title level={5}>Owner History</Title>
            {reviewedOwnerRequestsQuery.isLoading ? (
              <Spin />
            ) : (
              reviewedOwnerRequestsQuery.data.map((item) => (
                <Card key={item.id} size="small" style={{ marginBottom: 8 }}>
                  <Space direction="vertical">
                    <strong>{item.shopName}</strong>
                    <Tag color={item.status === "approved" ? "green" : "red"}>
                      {item.status}
                    </Tag>
                  </Space>
                </Card>
              ))
            )}
          </Col>

          <Col xs={24} md={12}>
            <Title level={5}>Intro History</Title>
            {reviewedIntroReviewsQuery.isLoading ? (
              <Spin />
            ) : (
              reviewedIntroReviewsQuery.data.map((item) => (
                <Card key={item.shopId} size="small" style={{ marginBottom: 8 }}>
                  <Space direction="vertical">
                    <strong>{item.shopName}</strong>
                    <Tag
                      color={
                        item.reviewStatus === "approved" ? "green" : "red"
                      }
                    >
                      {item.reviewStatus}
                    </Tag>
                  </Space>
                </Card>
              ))
            )}
          </Col>
        </Row>
      </Card>
      <Card title="📊 Thống kê quán & địa điểm" style={{ borderRadius: 16 }}>
  <Space direction="vertical" style={{ width: "100%" }} size={16}>
    
    {/* FILTER */}
    <Space>
      <Text strong>Khoảng thời gian:</Text>
      {periods.map((p) => (
        <Button
          key={p}
          type={statsPeriod === p ? "primary" : "default"}
          onClick={() => setStatsPeriod(p)}
        >
          {p} ngày
        </Button>
      ))}

      <Text strong>Chỉ số:</Text>
      {metrics.map((m) => (
        <Button
          key={m}
          type={statsMetric === m ? "primary" : "default"}
          onClick={() => setStatsMetric(m)}
        >
          {m}
        </Button>
      ))}
    </Space>

    {/* TABLES */}
    <Row gutter={16}>
      <Col xs={24} lg={12}>
        <Card title="Top quán">
       {topShopsQuery.isLoading ? (
  <Spin />
) : !topShopsQuery.data ? (
  <Spin />
) : topShopsQuery.data.length === 0 ? (
  <Empty />
) : (
  <Table
    rowKey="slug"
    columns={shopsColumns}
    dataSource={topShopsQuery.data}
    pagination={false}
  />
)}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="Top POI">
          {topPoisQuery.isLoading ? (
            <Spin />
          ) : topPoisQuery.data?.length === 0 ? (
            <Empty />
          ) : (
          <Table
  rowKey={(record) => record.id || record.Id}
  columns={topPoisColumns} // <--- Dùng bộ cột thống kê
  dataSource={Array.isArray(topPoisQuery.data) ? topPoisQuery.data : []}
  pagination={false}
  size="middle"
/>
          )}
        </Card>
      </Col>
    </Row>
  </Space>
</Card>
<Card title="📍 Quản lý POI" style={{ borderRadius: 16 }}>
  <Space direction="vertical" style={{ width: "100%" }} size={16}>

    {/* SEARCH + ADD */}
    <Space style={{ width: "100%", justifyContent: "space-between" }}>
      <Input
        placeholder="Tìm POI..."
        value={poiSearch}
        onChange={(e) => setPoiSearch(e.target.value)}
        style={{ width: 300 }}
      />

      <Button
        type="primary"
        onClick={() => {
          setEditingPoi(null);
          setPoiModalVisible(true);
        }}
      >
        + Thêm POI
      </Button>
    </Space>

    {/* TABLE */}
    <Table
      rowKey="Id"
      loading={poisQuery.isLoading}
      dataSource={Array.isArray(poisQuery.data)
  ? poisQuery.data.filter((p) => {
      const name = p?.Name ?? "";
      return name.toLowerCase().includes(poiSearch.toLowerCase());
    })
  : []
}
      columns={[
        ...poisColumns,
        {
          title: "Hành động",
          render: (_, record) => (
            <Space>
              <Button
                onClick={() => {
                  setEditingPoi(record);
                  setPoiModalVisible(true);
                }}
              >
                Sửa
              </Button>

              <Button
                danger
                onClick={() =>
  poiDeleteMutation.mutate(record.id || record.Id)
}
              >
                Xóa
              </Button>
            </Space>
          ),
        },
      ]}
    />
  </Space>
</Card>
<Modal
  title={editingPoi ? "Cập nhật POI" : "Thêm POI"}
  open={poiModalVisible}
  onCancel={() => setPoiModalVisible(false)}
  footer={null}
  destroyOnClose // Reset form khi đóng modal
>
  <Form
    layout="vertical"
    // 🔥 Map lại dữ liệu để khi nhấn "Sửa", form hiển thị đúng giá trị
    initialValues={
      editingPoi
        ? {
            ...editingPoi,
            Name: editingPoi.name?.vi || editingPoi.name?.en || editingPoi.shopName || "",
            description: editingPoi.description?.vi || editingPoi.description?.en || "",
            shopAddress: editingPoi.shopAddress || "",
            Latitude: editingPoi.lat ?? editingPoi.location?.lat ?? "",
            Longitude: editingPoi.lng ?? editingPoi.location?.lng ?? "",
          }
        : {}
    }
    onFinish={(values) => {
      // 🔥 Cấu trúc lại payload theo đúng object JSON của backend
      const payload = {
        name: {
          vi: values.Name,
          en: values.Name,
        },
        description: {
          vi: values.description || "",
          en: values.description || "",
        },
        shopAddress: values.shopAddress,
        category: editingPoi?.category || "street_food", // Giữ nguyên category cũ nếu đang sửa
        lat: Number(values.Latitude), 
        lng: Number(values.Longitude),
        radius: editingPoi?.radius || 35, // Giữ nguyên radius cũ hoặc default 35
        imageUrl: editingPoi?.imageUrl || null,
      };

      if (editingPoi) {
        poiUpdateMutation.mutate({
          id: editingPoi.id || editingPoi.Id,
          data: payload,
        });
      } else {
        poiCreateMutation.mutate(payload);
      }
      
      // Đóng modal sau khi submit (tuỳ chọn)
      setPoiModalVisible(false); 
    }}
  >
    <Form.Item 
      name="Name" 
      label="Tên" 
      rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
    >
      <Input placeholder="Nhập tên quán/địa điểm" />
    </Form.Item>

    <Form.Item 
      name="shopAddress" 
      label="Địa chỉ" 
      rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
    >
      <Input placeholder="Nhập địa chỉ đầy đủ" />
    </Form.Item>

    <Form.Item 
      name="description" 
      label="Mô tả"
    >
      <Input.TextArea rows={3} placeholder="Nhập mô tả về địa điểm này..." />
    </Form.Item>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item 
          name="Latitude" 
          label="Vĩ độ (Latitude)" 
          rules={[{ required: true, message: 'Thiếu vĩ độ!' }]}
        >
          <Input placeholder="VD: 10.758995" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item 
          name="Longitude" 
          label="Kinh độ (Longitude)" 
          rules={[{ required: true, message: 'Thiếu kinh độ!' }]}
        >
          <Input placeholder="VD: 106.703621" />
        </Form.Item>
      </Col>
    </Row>

    <Button 
      type="primary" 
      htmlType="submit" 
      block 
      loading={poiCreateMutation.isPending || poiUpdateMutation.isPending}
    >
      {editingPoi ? "Lưu cập nhật" : "Thêm POI"}
    </Button>
  </Form>
</Modal>
    </Space>
  );
}