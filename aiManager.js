const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AIManager {
  constructor(agentStatus) {
    this.agentStatus = agentStatus;
    this.generatedDir = path.join(__dirname, 'generated');
    if (!fs.existsSync(this.generatedDir)) {
      fs.mkdirSync(this.generatedDir, { recursive: true });
    }
  }

  // Gerar imagens locais com Canvas (sem APIs caras)
  async generateImage(prompt) {
    this.agentStatus.setAIToolStatus('image-primary', 'loading');
    
    try {
      const imagePath = await this.generateLocalImage(prompt);
      this.agentStatus.setAIToolStatus('image-primary', 'success', 'Canvas (Local)');
      this.agentStatus.log(`Imagem gerada localmente: ${prompt.substring(0, 50)}...`);
      return imagePath;
    } catch (error) {
      this.agentStatus.log(`Erro ao gerar imagem: ${error.message}`);
      return this.getDefaultImage();
    }
  }

  async generateLocalImage(prompt) {
    try {
      const canvas = createCanvas(1024, 1024);
      const ctx = canvas.getContext('2d');

      // Paleta de cores variadas
      const colors = [
        { bg: ['#667eea', '#764ba2'], text: '#ffffff' },
        { bg: ['#f093fb', '#f5576c'], text: '#ffffff' },
        { bg: ['#4facfe', '#00f2fe'], text: '#ffffff' },
        { bg: ['#43e97b', '#38f9d7'], text: '#000000' },
        { bg: ['#fa709a', '#fee140'], text: '#000000' }
      ];

      const color = colors[Math.floor(Math.random() * colors.length)];

      // Criar gradiente
      const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
      gradient.addColorStop(0, color.bg[0]);
      gradient.addColorStop(1, color.bg[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      // Adicionar efeitos decorativos
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const r = Math.random() * 300 + 100;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Título
      ctx.fillStyle = color.text;
      ctx.font = 'bold 56px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      // Truncar prompt se muito longo
      const title = prompt.substring(0, 40);
      ctx.fillText(title, 512, 400);

      // Subtítulo
      ctx.font = '32px Arial';
      ctx.fillText('Gerado com IA Local', 512, 550);

      // Timestamp
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const timestamp = new Date().toLocaleTimeString('pt-BR');
      ctx.fillText(timestamp, 512, 900);

      // Salvar imagem
      const imagePath = path.join(this.generatedDir, `${Date.now()}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(imagePath, buffer);
      return imagePath;
    } catch (error) {
      throw new Error(`Erro ao gerar imagem com canvas: ${error.message}`);
    }
  }

  getDefaultImage() {
    this.agentStatus.log('Gerando imagem padrão');
    try {
      const canvas = createCanvas(1024, 1024);
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Agente de IA', 512, 450);
      ctx.font = '32px Arial';
      ctx.fillText('Redes Sociais', 512, 550);

      const imagePath = path.join(this.generatedDir, 'default.png');
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(imagePath, buffer);
      return imagePath;
    } catch (error) {
      this.agentStatus.log(`Erro ao gerar imagem padrão: ${error.message}`);
      throw error;
    }
  }

  // Gerar vídeo com FFmpeg
  async generateVideo(imagePath, verse) {
    this.agentStatus.setAIToolStatus('video', 'loading');

    try {
      const ffmpeg = require('ffmpeg-static');
      const videoPath = path.join(this.generatedDir, `${Date.now()}.mp4`);

      return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpeg, [
          '-loop', '1',
          '-i', imagePath,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-t', '15',
          '-pix_fmt', 'yuv420p',
          '-vf', 'scale=1024:1024',
          videoPath
        ]);

        ffmpegProcess.stderr.on('data', (chunk) => {
          const message = chunk.toString();
          if (!message.includes('frame=') && !message.includes('Metadata')) {
            this.agentStatus.log(`FFmpeg: ${message.trim().substring(0, 100)}`);
          }
        });

        ffmpegProcess.on('close', (code) => {
          if (code === 0) {
            this.agentStatus.setAIToolStatus('video', 'success', 'FFmpeg (Local)');
            this.agentStatus.log(`Vídeo gerado: ${videoPath}`);
            resolve(videoPath);
          } else {
            reject(new Error(`Erro ao gerar vídeo (código ${code})`));
          }
        });

        ffmpegProcess.on('error', (error) => {
          this.agentStatus.log(`Erro no ffmpeg: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      this.agentStatus.log(`Erro ao gerar vídeo: ${error.message}`);
      throw error;
    }
  }

  // Gerar texto (sem APIs caras)
  async generateText(verse) {
    this.agentStatus.setAIToolStatus('text', 'loading');

    try {
      const text = await this.generateLocalText(verse);
      this.agentStatus.setAIToolStatus('text', 'success', 'Local');
      return text;
    } catch (error) {
      this.agentStatus.log(`Erro ao gerar texto: ${error.message}`);
      return verse;
    }
  }

  async generateLocalText(verse) {
    // Texto padrão inspirador em português
    const templates = [
      `"${verse}" - Uma mensagem poderosa para hoje.`,
      `Compartilhando: ${verse}`,
      `Inspiração: ${verse.substring(0, 50)}...`,
      `Reflexão diária: ${verse}`,
      `Mensagem: ${verse.substring(0, 60)}...`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }
}

module.exports = AIManager;
