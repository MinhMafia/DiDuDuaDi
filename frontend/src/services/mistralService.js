import axios from "axios";

export const askMistral = async (messages) => {
  const response = await axios.post(
    "https://api.mistral.ai/v1/chat/completions",
    {
      model: "mistral-medium-latest",
      messages: messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.text,
      })),
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_MISTRAL_API_KEY}`,
      },
    }
  );

  return response.data.choices[0]?.message?.content;
};
