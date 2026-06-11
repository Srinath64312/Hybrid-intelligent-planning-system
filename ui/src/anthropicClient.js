export const anthropicClient = {
  async summarizePlan(apiKey, planData, context) {
    if (!apiKey) {
      throw new Error("Anthropic API key is required.");
    }

    const systemPrompt = `You are a friendly, non-technical AI assistant. Your goal is to summarize complex AI/Algorithm execution results into a simple, easy-to-understand paragraph. Keep your response under 100 words. Focus on the outcome, why it happened, and what the numbers mean for a regular person. Do not use complex jargon.`;

    const userPrompt = `Please summarize this optimization run for a non-technical user.
Context: ${context}
Execution Data:
${JSON.stringify(planData, null, 2)}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (e) {
      console.error("Anthropic API Error:", e);
      throw e;
    }
  }
};
