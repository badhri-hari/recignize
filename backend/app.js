import axios from "axios";
import cors from "cors";
import { config } from "dotenv";
import express, { json } from "express";

config();

const app = express();
app.use(json());
app.use(cors());

const PORT = process.env.PORT || 3000;

app.post("/ai", async (req, res) => {
  const items = req.body.items;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Items array is required." });
  }

  const userPrompt = `Here is a list of available items:\n${JSON.stringify(
    items,
    null,
    2
  )}\n\nPlease generate as many valid and creative recipe combinations as possible. Each recipe should use a subset of the ingredients.`;

  const systemPrompt = `
You are a JSON recipe generator. Based on the user's items, return as many unique recipes as possible using different combinations of the items. Each recipe must be a valid JSON object with these exact keys:
- "title": string (a catchy name)
- "ingredients": string[] (only the ingredients used for this recipe)
- "instructions": string (multi-step instructions, with each step numbered like '1. Do this.', '2. Then this.', etc.)

Respond ONLY with a single JSON array of recipe objects. Do NOT include any other text. Each recipe can use a subset of the items—do NOT try to use all items in every recipe.
`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content;
    if (!reply) throw new Error("No response from model");

    const cleaned = reply
      .replace(/^```json\s*/i, "")
      .replace(/```$/, "")
      .trim();

    let recipes;
    try {
      recipes = JSON.parse(cleaned);
    } catch (_) {
      console.error("Failed to parse AI response:", cleaned);
      return res.status(500).json({ error: "Invalid JSON from AI model." });
    }

    return res.status(200).json({ recipes });
  } catch (err) {
    console.error("Model error:", err.response?.data || err.message);

    if (err.response) {
      let message = "Unknown error";
      const data = err.response?.data;

      if (typeof data?.error === "string") {
        message = data.error;
      } else if (typeof data?.message === "string") {
        message = data.message;
      } else if (typeof data?.error?.metadata?.raw === "string") {
        message = data.error.metadata.raw;
      } else if (typeof data?.error?.message === "string") {
        message = data.error.message;
      } else {
        message = JSON.stringify(data?.error || data || "OpenRouter API error");
      }

      return res.status(err.response?.status || 500).json({ error: message });
    }

    return res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
