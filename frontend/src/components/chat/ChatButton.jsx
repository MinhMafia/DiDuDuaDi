import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getPois } from "../../services/poiService";
import { getLocalizedValue } from "../../utils/helpers";
import { askMistral } from "../../services/mistralService";

import {
  Drawer,
  Button,
  Input,
  Space,
  Typography,
  Avatar,
  Spin,
} from "antd";
import {
  MessageOutlined,
  UserOutlined,
  RobotOutlined,
  SendOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function ChatButton() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: t("chat.welcome", "Xin chào! Mình là trợ lý du lịch AI. Mình có thể giúp gì cho bạn hôm nay?"),
    },
  ]);

  const poisQuery = useQuery({
    queryKey: ["pois", "chat"],
    queryFn: getPois,
    select: (res) => res.data ?? [],
  });

  const localizedPois = useMemo(
    () =>
      (poisQuery.data ?? []).map((poi) => ({
        ...poi,
        displayDescription: getLocalizedValue(poi.description, i18n.language),
        displayName: getLocalizedValue(poi.name, i18n.language),
      })),
    [i18n.language, poisQuery.data],
  );

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const aiText = await askMistral([
        {
          role: "system",
          text: `Bạn là trợ lý du lịch:\n${localizedPois
            .map((p) => `${p.displayName}: ${p.displayDescription}`)
            .join("\n")}`,
        },
        ...messages,
        userMsg,
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: aiText || "🤖 Rất tiếc, mình chưa có câu trả lời.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "⚠️ Đã xảy ra lỗi kết nối với AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* CSS tùy chỉnh cho thanh cuộn (Scrollbar) */}
      <style>
        {`
          .chat-scroll-container::-webkit-scrollbar {
            width: 6px;
          }
          .chat-scroll-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .chat-scroll-container::-webkit-scrollbar-thumb {
            background: #d9d9d9;
            border-radius: 10px;
          }
          .chat-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #bfbfbf;
          }
        `}
      </style>

      {/* Nút Chat nổi */}
      <Button
        type="primary"
        shape="circle"
        icon={<MessageOutlined style={{ fontSize: 24 }} />}
        size="large"
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 80,
          zIndex: 1000,
          width: 64,
          height: 64,
          background: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
          border: "none",
          boxShadow: "0 10px 25px rgba(0, 114, 255, 0.4)",
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      />

      {/* Drawer Chat */}
      <Drawer
        title={
          <Space>
            <Avatar size="small" icon={<RobotOutlined />} style={{ background: "#10a37f" }} />
            <span style={{ fontWeight: 600, color: "#1f2937" }}>AI Assistant</span>
          </Space>
        }
        placement="right"
        width={400}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        headerStyle={{
          borderBottom: "1px solid #f0f0f0",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
        }}
        bodyStyle={{
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "#f3f4f6", // Màu nền xám nhạt nhẹ nhàng
        }}
      >
        {/* Khu vực hiển thị tin nhắn */}
        <div
          className="chat-scroll-container"
          style={{
            flex: 1,
            padding: "20px 16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {!isUser && (
                  <Avatar
                    icon={<RobotOutlined />}
                    style={{ background: "#10a37f", flexShrink: 0 }}
                  />
                )}

                <div
                  style={{
                    background: isUser
                      ? "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)" // Gradient xanh hiện đại cho User
                      : "#ffffff", // Trắng tinh tế cho AI
                    color: isUser ? "#ffffff" : "#1f2937",
                    padding: "12px 16px",
                    // Bo góc bất đối xứng tạo hình đuôi bong bóng chat
                    borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                    maxWidth: "75%",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    boxShadow: isUser
                      ? "0 4px 15px rgba(0, 114, 255, 0.2)"
                      : "0 2px 10px rgba(0, 0, 0, 0.05)",
                    border: isUser ? "none" : "1px solid #e5e7eb",
                    fontSize: "15px",
                    lineHeight: "1.5",
                  }}
                >
                  <Text style={{ color: "inherit" }}>{msg.text}</Text>
                </div>

                {isUser && (
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ background: "#d1d5db", flexShrink: 0 }}
                  />
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", gap: 8, alignItems: "flex-end" }}>
              <Avatar icon={<RobotOutlined />} style={{ background: "#10a37f" }} />
              <div
                style={{
                  background: "#ffffff",
                  padding: "12px 16px",
                  borderRadius: "20px 20px 20px 4px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                }}
              >
                <Spin size="small" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Khu vực nhập tin nhắn */}
        <div
          style={{
            padding: "16px",
            background: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            boxShadow: "0 -4px 10px rgba(0,0,0,0.02)",
          }}
        >
          <form onSubmit={handleSubmit} style={{ margin: 0 }}>
            <Space.Compact style={{ width: "100%", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", borderRadius: "24px" }}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder", "Nhập câu hỏi của bạn...")}
                size="large"
                style={{
                  borderTopLeftRadius: "24px",
                  borderBottomLeftRadius: "24px",
                  borderRight: "none",
                  paddingLeft: "20px",
                }}
                disabled={loading}
              />
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                size="large"
                loading={loading}
                style={{
                  borderTopRightRadius: "24px",
                  borderBottomRightRadius: "24px",
                  background: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
                  border: "none",
                  padding: "0 24px",
                }}
              />
            </Space.Compact>
          </form>
        </div>
      </Drawer>
    </>
  );
}