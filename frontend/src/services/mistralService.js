import apiClient from "./apiClient";

export const askMistral = async (messages) => {
  try {
    const response = await apiClient.post("/ai/chat", {
      messages: messages.map((msg) => ({
        role: msg.role,
        text: msg.text,
      })),
    });

    return response.data?.data?.reply ?? "";
  } catch (error) {
    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.Message ||
      error?.message ||
      "Unable to reach AI assistant.";

    throw new Error(serverMessage);
  }
};
