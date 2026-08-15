import { Request } from "../models/Request.model.js";
import { classifySupportMessage } from "../services/ai.service.js";
import Groq from "groq-sdk";

const PRIORITY_WEIGHT = {
  Low: 1,
  Medium: 2,
  High: 3,
};

// Bag-of-words token similarity check (handles word order like "network issue" vs "issue in network")
function tokenSimilarity(str1, str2) {
  const clean = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const tokens1 = new Set(clean(str1));
  const tokens2 = new Set(clean(str2));

  const intersection = [...tokens1].filter((x) => tokens2.has(x));
  const union = new Set([...tokens1, ...tokens2]);

  if (union.size === 0) return 0;
  return intersection.length / union.size;
}

// Semantic checker (Local token overlap + LLM verification)
async function isMeaningfullySame(msg1, msg2) {
  // 1. Direct match or same words in different order ("network issue" === "issue in network")
  const similarity = tokenSimilarity(msg1, msg2);
  if (similarity >= 0.7) {
    return true;
  }

  // 2. Fallback to Groq LLM check
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return false;

    const groq = new Groq({ apiKey });
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            'You are a ticket deduplication system. Respond with ONLY the word "YES" if the two messages represent the exact same support issue, or "NO" if they are different.',
        },
        {
          role: "user",
          content: `Message 1: "${msg1}"\nMessage 2: "${msg2}"`,
        },
      ],
      temperature: 0,
      max_tokens: 5,
    });

    const answer = res.choices[0]?.message?.content?.trim().toUpperCase();
    return answer.includes("YES");
  } catch (err) {
    console.error("Deduplication error:", err.message);
    return false;
  }
}

export const createRequest = async (req, res) => {
  try {
    const { name, email, message, priority = "Low" } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "name, email, and message are required fields.",
      });
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "priority must be Low, Medium, or High.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMessage = message.trim();
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);

    // Fetch the most recent tickets for this email
    const recentRequests = await Request.find({
      email: normalizedEmail,
      createdAt: { $gte: sixtySecondsAgo },
    }).sort({ createdAt: -1 });

    let existingRequest = null;

    // Check if any recent ticket matches within the 60s window
    for (const reqItem of recentRequests) {
      const isDuplicate = await isMeaningfullySame(
        reqItem.message,
        normalizedMessage,
      );
      if (isDuplicate) {
        existingRequest = reqItem;
        break;
      }
    }

    // Duplicate Handling
    if (existingRequest) {
      const incomingWeight = PRIORITY_WEIGHT[priority];
      const existingWeight = PRIORITY_WEIGHT[existingRequest.priority];

      if (incomingWeight > existingWeight) {
        existingRequest.priority = priority;
        await existingRequest.save();

        return res.status(200).json({
          success: true,
          message:
            "Duplicate detected. Existing request priority updated to higher value.",
          isDuplicate: true,
          data: existingRequest,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Duplicate submission ignored within 60-second window.",
        isDuplicate: true,
        data: existingRequest,
      });
    }

    // AI Classification (Receives only message)
    const { category, classificationSource } =
      await classifySupportMessage(normalizedMessage);

    const newRequest = await Request.create({
      name: name.trim(),
      email: normalizedEmail,
      message: normalizedMessage,
      priority,
      category,
      classificationSource,
    });

    return res.status(201).json({
      success: true,
      message: "Support request created successfully.",
      data: newRequest,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
