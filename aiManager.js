const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AIManager {
  constructor(agentStatus) {
    this.agentStatus = agentStatus;
    this.cache = {};
  }

  // Gerar imagens com múltiplas ferramentas
  async generateImage(prompt) {
    this.agentStatus.setAIToolStatus('image-primary', 'loading');
    
    try {
      // Tentar Hugging Face primeiro (gratuito)
      const imageUrl = await this.generateWithHuggingFace(prompt);
      this.agentStatus.setAIToolStatus('image-primary', 'success', 'Hugging Face');
      this.agentStatus.log(`Imagem gerada com Hugging Face: ${prompt.substring(0, 50)}...`);
      return imageUrl;
    } catch (error) {
      this.agentStatus.log(`Erro ao gerar com Hugging Face: ${error.message}`);
      
      try {
        // Fallback: Stability AI Free Tier
        const imageUrl = await this.generateWithStabilityAI(prompt);
        this.agentStatus.setAIToolStatus('image-primary', 'success', 'Stability AI');
        this.agentStatus.log(`Imagem gerada com Stability AI`);
        return imageUrl;
      } catch (error2) {
        this.agentStatus.log(`Erro ao gerar com Stability AI: ${error2.message}`);
        
        try {
          // Fallback: OpenAI DALL-E (Free Trial)
          const imageUrl = await this.generateWithOpenAI(prompt);
          this.agentStatus.setAIToolStatus('image-primary', 'success', 'OpenAI');
          this.agentStatus.log(`Imagem gerada com OpenAI`);
          return imageUrl;
        } catch (error3) {
          this.agentStatus.log(`Erro ao gerar imagem: ${error3.message}`);
          // Usar imagem padrão
          return this.getDefaultImage();
        }
      }
    }
  }

  async generateWithHuggingFace(prompt) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('HuggingFace API key não configurada');

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (response.data && response.data.length > 0) {
      // Salvar imagem localmente
      const imagePath = path.join(__dirname, 'generated', `${Date.now()}.png`);
      if (!fs.existsSync(path.dirname(imagePath))) {
        fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      }
      fs.writeFileSync(imagePath, Buffer.from(response.data));
      return imagePath;
    }
    throw new Error('Resposta inválida do HuggingFace');
  }

  async generateWithStabilityAI(prompt) {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) throw new Error('Stability AI API key não configurada');

    const response = await axios.post(
      'https://api.stability.ai/v1/generate',
      { prompt, steps: 20 },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.artifacts) {
      const imagePath = path.join(__dirname, 'generated', `${Date.now()}.png`);
      if (!fs.existsSync(path.dirname(imagePath))) {
        fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      }
      fs.writeFileSync(imagePath, Buffer.from(response.data.artifacts[0].data, 'base64'));
      return imagePath;
    }
    throw new Error('Resposta inválida do Stability AI');
  }

  async generateWithOpenAI(prompt) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024'
    });

    if (response.data[0].url) {
      const imageUrl = response.data[0].url;
      // Baixar e salvar localmente
      const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imagePath = path.join(__dirname, 'generated', `${Date.now()}.png`);
      if (!fs.existsSync(path.dirname(imagePath))) {
        fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      }
      fs.writeFileSync(imagePath, imageData.data);
      return imagePath;
    }
    throw new Error('Erro OpenAI: sem URL');
  }

  getDefaultImage() {
    this.agentStatus.log('Usando imagem padrão');
    return path.join(__dirname, 'assets', 'default-image.png');
  }

  // Gerar vídeo
  async generateVideo(imagePath, verse) {
    this.agentStatus.setAIToolStatus('video', 'loading');
    
    try {
      // Usar ffmpeg para criar vídeo de imagem estática
      const ffmpeg = require('ffmpeg-static');
      const { spawn } = require('child_process');
      const videoPath = path.join(__dirname, 'generated', `${Date.now()}.mp4`);

      if (!fs.existsSync(path.dirname(videoPath))) {
        fs.mkdirSync(path.dirname(videoPath), { recursive: true });
      }

      return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpeg, [
          '-loop', '1',
          '-i', imagePath,
          '-c:v', 'libx264',
          '-t', '15',
          '-pix_fmt', 'yuv420p',
          videoPath
        ]);

        ffmpegProcess.on('close', (code) => {
          if (code === 0) {
            this.agentStatus.setAIToolStatus('video', 'success', 'FFmpeg');
            this.agentStatus.log(`Vídeo gerado: ${videoPath}`);
            resolve(videoPath);
          } else {
            reject(new Error('Erro ao gerar vídeo'));
          }
        });

        ffmpegProcess.on('error', reject);
      });
    } catch (error) {
      this.agentStatus.log(`Erro ao gerar vídeo: ${error.message}`);
      throw error;
    }
  }

  // Gerar texto (descrição) com múltiplas ferramentas
  async generateText(verse) {
    this.agentStatus.setAIToolStatus('text', 'loading');
    
    try {
      // Tentar Ollama (local, sem limites)
      const text = await this.generateWithOllama(verse);
      this.agentStatus.setAIToolStatus('text', 'success', 'Ollama (Local)');
      return text;
    } catch (error) {
      this.agentStatus.log(`Ollama não disponível, usando fallback`);
      
      try {
        // Fallback: OpenAI
        const text = await this.generateWithOpenAIText(verse);
        this.agentStatus.setAIToolStatus('text', 'success', 'OpenAI');
        return text;
      } catch (error2) {
        this.agentStatus.log(`Erro ao gerar texto: ${error2.message}`);
        return verse; // Retornar apenas o versículo
      }
    }
  }

  async generateWithOllama(verse) {
    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'llama2',
        prompt: `Crie uma descrição poética e inspiradora para este versículo bíblico: "${verse}". Resposta em uma frase.`,
        stream: false
      });

      if (response.data && response.data.response) {
        return response.data.response.trim();
      }
      throw new Error('Resposta inválida');
    } catch (error) {
      throw new Error(`Ollama não disponível: ${error.message}`);
    }
  }

  async generateWithOpenAIText(verse) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Crie uma descrição poética e inspiradora para este versículo bíblico: "${verse}". Resposta em uma frase.`
        }
      ],
      max_tokens: 100
    });

    return response.choices[0].message.content.trim();
  }
}

module.exports = AIManager;