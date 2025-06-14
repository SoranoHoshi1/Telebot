export class AIService {
  constructor() {
    this.apiKey = global.config?.apiKeys?.openai || '';
    this.groqKey = global.config?.apiKeys?.groq || '';
    this.enabled = this.apiKey.length > 0 || this.groqKey.length > 0;
  }

  async generateResponse(prompt, options = {}) {
    if (!this.enabled) {
      throw new Error('AI service not configured');
    }

    try {
      if (this.groqKey) {
        return await this.useGroq(prompt, options);
      } else if (this.apiKey) {
        return await this.useOpenAI(prompt, options);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  async useOpenAI(prompt, options = {}) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 150,
        temperature: options.temperature || 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    return data.choices[0]?.message?.content || 'No response generated';
  }

  async useGroq(prompt, options = {}) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.groqKey}`
      },
      body: JSON.stringify({
        model: options.model || 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 150,
        temperature: options.temperature || 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    return data.choices[0]?.message?.content || 'No response generated';
  }

  isEnabled() {
    return this.enabled;
  }
}