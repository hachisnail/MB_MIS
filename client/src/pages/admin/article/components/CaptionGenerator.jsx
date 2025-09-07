// src/utils/captionUtils.js
import axios from "axios";

export const handleGenerateCaption = async (articleContent, setCaption, setIsGeneratingCaption) => {
  if (!articleContent.trim()) {
    window.alert('Please write some content in the editor first to generate a caption.');
    return;
  }

  setIsGeneratingCaption(true);
  let retries = 0;
  const maxRetries = 5;
  let success = false;

  const prompt = `Summarize the following article content into a short, engaging caption, suitable for public display on a homepage. The caption should be no more than 150 characters. The content is: ${articleContent}`;

  while (retries < maxRetries && !success) {
    try {
      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setCaption(generatedText);
      success = true;
    } catch (error) {
      retries++;
      const delay = Math.pow(2, retries) * 1000;
      console.error(`API call failed. Retrying in ${delay / 1000}s...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  setIsGeneratingCaption(false);
  if (!success) {
    window.alert('Failed to generate caption. Please try again.');
  }
};

export const handleSummarizeCaption = async (articleContent, setCaption, setIsSummarizing, BASE_URL) => {
  if (!articleContent.trim()) {
    window.alert('Please write some content in the editor first to summarize.');
    return;
  }

  setIsSummarizing(true);
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/summarize`,
      { text: articleContent },
      { withCredentials: true }
    );
    setCaption(response.data.summary || "");
  } catch (error) {
    window.alert('Failed to summarize. Please try again.');
    console.error(error);
  }
  setIsSummarizing(false);
};
