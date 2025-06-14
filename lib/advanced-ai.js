
import axios from 'axios';

export class AdvancedAI {
  constructor(config) {
    this.config = config;
    this.conversations = new Map();
    this.personalities = {
      default: 'Kamu adalah asisten AI yang membantu dan ramah.',
      funny: 'Kamu adalah AI yang lucu dan suka bercanda.',
      professional: 'Kamu adalah AI profesional yang memberikan jawaban formal.',
      creative: 'Kamu adalah AI kreatif yang memberikan jawaban imajinatif.',
      technical: 'Kamu adalah AI teknis yang ahli dalam programming dan teknologi.'
    };
  }

  getConversation(userId) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, {
        messages: [],
        personality: 'default',
        context: [],
        lastActivity: Date.now()
      });
    }
    return this.conversations.get(userId);
  }

  addMessage(userId, role, content) {
    const conversation = this.getConversation(userId);
    conversation.messages.push({ role, content, timestamp: Date.now() });
    
    if (conversation.messages.length > this.config.ai.contextLength) {
      conversation.messages = conversation.messages.slice(-this.config.ai.contextLength);
    }
    
    conversation.lastActivity = Date.now();
  }

  setPersonality(userId, personality) {
    const conversation = this.getConversation(userId);
    if (this.personalities[personality]) {
      conversation.personality = personality;
      return true;
    }
    return false;
  }

  async generateResponse(userId, message, options = {}) {
    try {
      const conversation = this.getConversation(userId);
      this.addMessage(userId, 'user', message);

      const systemPrompt = this.personalities[conversation.personality];
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.messages.slice(-5)
      ];

      const response = await this.callAI(messages, options);
      this.addMessage(userId, 'assistant', response);
      
      return response;
    } catch (error) {
      global.log.error('AI generation error:', error);
      throw error;
    }
  }

  async callAI(messages, options = {}) {
    const apis = [
      {
        name: 'openai',
        call: () => this.callOpenAI(messages, options)
      },
      {
        name: 'huggingface',
        call: () => this.callHuggingFace(messages, options)
      },
      {
        name: 'ryzendesu',
        call: () => this.callRyzendesu(messages.slice(-1)[0].content)
      }
    ];

    for (const api of apis) {
      try {
        return await api.call();
      } catch (error) {
        global.log.warn(`${api.name} API gagal:`, error.message);
        continue;
      }
    }

    throw new Error('Semua AI API gagal');
  }

  async callOpenAI(messages, options = {}) {
    if (!this.config.api.openai || this.config.api.openai === 'your_openai_api_key') {
      throw new Error('OpenAI API key tidak tersedia');
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: options.model || this.config.ai.defaultModel,
      messages: messages,
      max_tokens: options.maxTokens || this.config.ai.maxTokens,
      temperature: options.temperature || this.config.ai.temperature
    }, {
      headers: {
        'Authorization': `Bearer ${this.config.api.openai}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  }

  async callHuggingFace(messages, options = {}) {
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
      { inputs: prompt },
      {
        headers: {
          'Authorization': `Bearer ${this.config.api.huggingface}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data[0]?.generated_text || 'Maaf, tidak bisa memproses permintaan.';
  }

  async callRyzendesu(message) {
    const response = await axios.get(`https://api.ryzendesu.vip/api/ai/chatgpt`, {
      params: { text: message }
    });

    if (response.data.success) {
      return response.data.response;
    }
    throw new Error('Ryzendesu API error');
  }

  async moderateContent(text) {
    if (!this.config.ai.moderationEnabled) return { flagged: false };

    try {
      const response = await axios.post('https://api.openai.com/v1/moderations', {
        input: text
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.api.openai}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.results[0];
    } catch (error) {
      global.log.warn('Content moderation error:', error);
      return { flagged: false };
    }
  }

  clearConversation(userId) {
    this.conversations.delete(userId);
  }

  getStats() {
    return {
      activeConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values())
        .reduce((sum, conv) => sum + conv.messages.length, 0)
    };
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;

    for (const [userId, conversation] of this.conversations.entries()) {
      if (now - conversation.lastActivity > maxAge) {
        this.conversations.delete(userId);
      }
    }
  }
}

export default AdvancedAI;
