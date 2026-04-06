import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getPois } from "../../services/poiService";
import { getLocalizedValue } from "../../utils/helpers";

export default function ChatButton() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
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
    select: (response) => response.data ?? [],
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

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: buildAssistantReply(trimmed, localizedPois, i18n.language),
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
  }

  return (
    <>
      {isOpen ? (
        <section
          style={{
            position: "fixed",
            right: 16,
            bottom: 82,
            width: "min(380px, calc(100vw - 24px))",
            maxHeight: "70vh",
            background: "#ffffff",
            border: "1px solid #dbe4ee",
            borderRadius: 20,
            boxShadow: "0 20px 48px rgba(15, 23, 42, 0.18)",
            zIndex: 40,
            overflow: "hidden",
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
          }}
        >
          <header
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, #ff6b35, #f97316)",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ display: "block" }}>{t("chat.title")}</strong>
              <span style={{ fontSize: 13 }}>{t("chat.subtitle")}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                border: "none",
                background: "rgba(255,255,255,0.18)",
                color: "#fff",
                width: 32,
                height: 32,
                borderRadius: 999,
                cursor: "pointer",
                fontWeight: 700,
              }}
              aria-label={t("chat.close")}
            >
              {t("chat.close")}
            </button>
          </header>

          <div
            style={{
              padding: 16,
              overflowY: "auto",
              background: "#f8fafc",
              display: "grid",
              gap: 10,
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  justifySelf: message.role === "user" ? "end" : "start",
                  maxWidth: "86%",
                  background: message.role === "user" ? "#ffedd5" : "#fff",
                  color: "#0f172a",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: "10px 12px",
                  lineHeight: 1.45,
                  whiteSpace: "pre-wrap",
                }}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              padding: 12,
              display: "grid",
              gap: 10,
              borderTop: "1px solid #e2e8f0",
              background: "#fff",
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("chat.placeholder")}
              style={{
                width: "100%",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "12px 14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                border: "none",
                borderRadius: 14,
                background: "#0f766e",
                color: "#fff",
                padding: "12px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("chat.send")}
            </button>
          </form>
        </section>
      ) : null}

      <button
        style={{
          position: "fixed",
          right: 16,
          bottom: 76,
          width: 54,
          height: 54,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #ff6b35, #f97316)",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 14px 34px rgba(249, 115, 22, 0.32)",
          zIndex: 35,
        }}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={t("chat.fabLabel")}
      >
        {t("chat.fabLabel")}
      </button>
    </>
  );
}

function buildAssistantReply(message, pois, language) {
  const normalized = message.toLowerCase();

  const matchedPoi = pois.find((poi) =>
    poi.displayName.toLowerCase().includes(normalized) ||
    normalized.includes(poi.displayName.toLowerCase()),
  );

  if (matchedPoi) {
    return `${matchedPoi.displayName}: ${matchedPoi.displayDescription}`;
  }

  if (
    normalized.includes("an gi") ||
    normalized.includes("mon nao") ||
    normalized.includes("goi y") ||
    normalized.includes("what should i eat") ||
    normalized.includes("what to eat") ||
    normalized.includes("recommend")
  ) {
    const shortlist = pois
      .slice(0, 3)
      .map((poi) => `- ${poi.displayName}`)
      .join("\n");

    return language === "en"
      ? `Here are a few demo spots on Vinh Khanh food street:\n${shortlist}\nYou can tap a marker on the map to hear the description.`
      : `Đây là vài quán demo ở phố ẩm thực Vĩnh Khánh:\n${shortlist}\nBạn có thể chạm vào marker trên bản đồ để nghe mô tả.`;
  }

  if (
    normalized.includes("gan toi") ||
    normalized.includes("gan day") ||
    normalized.includes("near me") ||
    normalized.includes("nearby")
  ) {
    return language === "en"
      ? "Open the map and allow GPS. The app will highlight nearby restaurants and can auto-narrate when you get close."
      : "Hãy mở bản đồ và cấp quyền GPS. Ứng dụng sẽ hiện các quán gần bạn và có thể tự động đọc mô tả khi bạn đến gần.";
  }

  return language === "en"
    ? "I can suggest demo restaurants on Vinh Khanh food street, explain a selected place, or guide you to use the live map and audio narration."
    : "Mình có thể gợi ý các quán demo ở phố ẩm thực Vĩnh Khánh, giải thích về từng quán, hoặc hướng dẫn bạn dùng bản đồ và nghe mô tả bằng giọng nói.";
}
