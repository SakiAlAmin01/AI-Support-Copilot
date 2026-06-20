import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";

async function sendSlackNotification(ticket, note) {
    if (!SLACK_WEBHOOK_URL) return;
    try {
        await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `🚨 *L2 Dev Escalation Alert!*\n*Ticket:* ${ticket}\n*Internal Note:* ${note}`
            })
        });
        console.log("📢 Slack Webhook triggered successfully!");
    } catch (e) {
        console.error("Slack Notification Error:", e.message);
    }
}

app.post('/api/support', async (req, res) => {
    try {
        const { systemPrompt, userIssue, imageParts, actionType } = req.body;

        let contentsArray = [
            `CRITICAL RULE: You must always start your response text with exactly '[SENTIMENT: VALUE]' on the very first line, where VALUE must be either CRITICAL, FRUSTRATED, or NEUTRAL based on customer mood. Then write the actual response.\n\nContext Instruction: ${systemPrompt}\n\nCustomer Ticket: ${userIssue}`
        ];

        if (imageParts && imageParts.inlineData) {
            contentsArray.push({
                inlineData: {
                    data: imageParts.inlineData.data,
                    mimeType: imageParts.inlineData.mimeType
                }
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contentsArray,
            config: { temperature: 0.3 }
        });

        const finalOutput = response.text;

        if (actionType === 'escalate' && finalOutput.toUpperCase().includes('YES')) {
            console.log("⚠️ Escalation confirmed by AI. Launching Slack Automation Gateway...");
            sendSlackNotification(userIssue, finalOutput.replace(/\[SENTIMENT:.*?\]/, '').trim());
        }

        res.json({ result: finalOutput });
    } catch (error) {
        console.error("Multimodal Core Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(3000, () => {
    console.log('🔒 Secure Multimodal Gemini Enterprise Backend running on port 3000');
});
