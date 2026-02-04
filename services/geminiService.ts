import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { BLOG_POSTS } from '../constants';

const apiKey = process.env.API_KEY || ''; // Ensure API key is set in environment
const ai = new GoogleGenAI({ apiKey });

// Helper to convert blog posts to context string
const getBlogContext = () => {
  return BLOG_POSTS.map(p => `Title: ${p.title}\nDate: ${p.date}\nContent: ${p.content}`).join('\n---\n');
};

export const chatWithBot = async (message: string, history: {role: string, text: string}[]) => {
  try {
    const systemInstruction = `You are a helpful AI assistant for the website "AI Quanh Ta".
    Your knowledge base includes the following articles written between Feb 3, 2026 and Feb 5, 2026:
    ${getBlogContext()}
    
    Answer user questions based on these articles. If the question is outside this scope, answer generally but mention you are focusing on the site's content.
    Summarize articles if asked. Be polite and helpful. Speak Vietnamese.`;

    // Construct simple history for the prompt context since we are doing single-turn mostly or managing state manually
    // Ideally use ai.chats.create but for simplicity with the prompt's diverse needs, we'll do generateContent with context
    let fullPrompt = `${systemInstruction}\n\nChat History:\n`;
    history.forEach(h => {
        fullPrompt += `${h.role === 'user' ? 'User' : 'Model'}: ${h.text}\n`;
    });
    fullPrompt += `User: ${message}\nModel:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Chat Error", error);
    throw error;
  }
};

export const generateSocialContent = async (
  platform: string,
  tone: string,
  topic: string,
  isSummary: boolean = false
) => {
  try {
    let prompt = "";
    if (isSummary) {
      prompt = `Hãy tóm tắt văn bản sau đây một cách súc tích. Văn bản: "${topic}"`;
    } else {
      prompt = `Hãy viết một caption cho mạng xã hội ${platform} với chủ đề: "${topic}".
      Phong cách viết: ${tone}.
      Yêu cầu: Viết hấp dẫn, sử dụng emoji phù hợp, hashtag liên quan. Ngôn ngữ: Tiếng Việt.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Content Gen Error", error);
    throw error;
  }
};

export const editImageWithAI = async (
  base64Image: string,
  prompt: string,
  type: 'edit' | 'swap',
  aspectRatio: string = '1:1'
) => {
  try {
    if (!prompt || !prompt.trim()) {
      throw new Error("Prompt cannot be empty for AI editing.");
    }

    // For specific edits or face swaps, we use the image capability
    // Remove header from base64 if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Good balance for image tasks
      config: {
        imageConfig: { aspectRatio },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ]
      },
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          {
            text: type === 'swap' 
              ? `Swap the face in this image with a generic friendly face or enhance it based on this instruction: ${prompt}. Return only the image.`
              : `Edit this image. Apply the following style/modification: ${prompt}. maintain the original composition.`
          }
        ]
      }
    });

    // Handle response safely
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const candidate = candidates[0];
        
        // Check if content and parts exist
        if (candidate.content && candidate.content.parts) {
            // Iterate to find image part
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            
            // If no image part, check for text to provide a useful error
            const textPart = candidate.content.parts.find(p => p.text);
            if (textPart) {
                 // Model refused to generate image and returned text explanation
                 throw new Error("AI phản hồi (Chỉ có văn bản): " + textPart.text);
            }
        }
        
        // Check for finishReason if content is empty (e.g. SAFETY)
        if (candidate.finishReason) {
             if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'IMAGE_SAFETY') {
                 throw new Error("Ảnh không được tạo do vi phạm chính sách an toàn của AI (Safety Filter). Vui lòng thử ảnh gốc khác hoặc mô tả nhẹ nhàng hơn.");
             }
            throw new Error(`AI không tạo được ảnh. Lý do: ${candidate.finishReason}`);
        }
    }
    
    throw new Error("Model did not return a valid response.");

  } catch (error) {
    console.error("Image Edit Error", error);
    throw error;
  }
};