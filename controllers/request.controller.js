import { Request } from "../models/Request.model.js";
import { classifySupportMessage } from "../services/ai.service.js";
import Groq from "groq-sdk";

const PRIORITY_WEIGHT = {
  Low: 1,
  Medium: 2,
  High: 3,
};

// Clean and tokenize text into distinct normalized words
function tokenize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

// Multi-tier local semantic & phrase similarity check
function isMeaningfullySameLocal(str1, str2) {
  const norm1 = str1
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
  const norm2 = str2
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

  // 1. Direct normalization match
  if (norm1 === norm2) return true;

  const t1 = tokenize(str1);
  const t2 = tokenize(str2);

  if (t1.length === 0 || t2.length === 0) return false;

  const set1 = new Set(t1);
  const set2 = new Set(t2);

  const intersection = [...set1].filter((x) => set2.has(x));
  const union = new Set([...set1, ...set2]);

  const jaccard = intersection.length / union.size;
  const minOverlap = intersection.length / Math.min(set1.size, set2.size);

  // 2. High Jaccard similarity OR full subset overlap
  // (e.g., "Payment fail" is 100% inside "payment is getting fail")
  return jaccard >= 0.4 || minOverlap >= 0.75;
}

// Full deduplication checker (Local fast-path + LLM verification)
async function isMeaningfullySame(msg1, msg2) {
  // Step 1: Fast local algorithmic check
  if (isMeaningfullySameLocal(msg1, msg2)) {
    return true;
  }

  // Step 2: Fallback to LLM semantic comparison
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
            'You are a support ticket deduplication system. Respond with ONLY "YES" if both messages describe the exact same underlying issue or intention, or "NO" if they describe different issues.',
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
    return Boolean(answer && answer.includes("YES"));
  } catch (err) {
    console.error("Deduplication AI error:", err.message);
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

    // Fetch the recent tickets for this email within the last 60 seconds
    const recentRequests = await Request.find({
      email: normalizedEmail,
      createdAt: { $gte: sixtySecondsAgo },
    }).sort({ createdAt: -1 });

    let existingRequest = null;

    // Check if any recent ticket is "meaningfully the same"
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

    // Duplicate Handling & Priority Escalation
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

    // AI Classification (Privacy-first: strictly message string only)
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
