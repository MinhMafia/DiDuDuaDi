import apiClient from "./apiClient";

export const askMistral = async (messages) => {
  const response = await apiClient.post("/ai/chat", {
    messages: messages.map((msg) => ({
      role: msg.role,
      text: msg.text,
    })),
  });

  return response.data?.data?.reply ?? "";
};
