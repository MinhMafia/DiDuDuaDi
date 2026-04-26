import { useMemo, useState } from "react";
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

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: t("chat.welcome"),
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
    [i18n.language, poisQuery.data]
  );

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
          text: aiText || "🤖 No response",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "⚠️ AI error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FLOAT BUTTON */}
      <Button
        type="primary"
        shape="circle"
        icon={<MessageOutlined />}
        size="large"
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 80,
          zIndex: 100,
          width: 56,
          height: 56,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      />

      {/* CHAT DRAWER */}
      <Drawer
        title="🤖 AI Assistant"
        placement="right"
        width={380}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        bodyStyle={{
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* MESSAGES */}
        <div
          style={{
            flex: 1,
            padding: 16,
            overflowY: "auto",
            background: "#f5f7fa",
          }}
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Space align="start">
                  {msg.role === "assistant" && (
                    <Avatar icon={<RobotOutlined />} />
                  )}

                  <div
                    style={{
                      background:
                        msg.role === "user" ? "#1677ff" : "#fff",
                      color: msg.role === "user" ? "#fff" : "#000",
                      padding: "10px 14px",
                      borderRadius: 16,
                      maxWidth: 260,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Text style={{ color: "inherit" }}>{msg.text}</Text>
                  </div>

                  {msg.role === "user" && (
                    <Avatar icon={<UserOutlined />} />
                  )}
                </Space>
              </div>
            ))}

            {loading && (
              <div style={{ textAlign: "center" }}>
                <Spin />
              </div>
            )}
          </Space>
        </div>

        {/* INPUT */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 12,
            borderTop: "1px solid #eee",
            background: "#fff",
          }}
        >
          <Space.Compact style={{ width: "100%" }}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
            />
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={loading}
            />
          </Space.Compact>
        </form>
      </Drawer>
    </>
  );
}
