const { createCanvas, loadImage } = require('canvas');
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

  async createLoveTemplate(ctx, canvas) {
    return {
      theme: { colors: ['#ff6b9d', '#c44569', '#ff9999'], emoji: '💕', accent: '#ff1493' },
      text: '💕 Amor Verdadeiro 💕',
      draw: async () => {
        const { width, height } = canvas;

        // Fundo com gradiente radial complexo
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
        gradient.addColorStop(0, '#ff6b9d');
        gradient.addColorStop(0.3, '#c44569');
        gradient.addColorStop(0.7, '#ff9999');
        gradient.addColorStop(1, '#ffb3ba');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Adicionar corações flutuantes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 30 + 10;
          this.drawHeart(ctx, x, y, size);
        }

        // Padrão de ondas suaves
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        for (let y = 0; y < height; y += 50) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x < width; x += 20) {
            ctx.lineTo(x, y + Math.sin(x * 0.01) * 10);
          }
          ctx.stroke();
        }
      }
    };
  }

  async createMotivationTemplate(ctx, canvas) {
    return {
      theme: { colors: ['#667eea', '#764ba2', '#4facfe'], emoji: '🚀', accent: '#00f2fe' },
      text: '💪 Força Interior 💪',
      draw: async () => {
        const { width, height } = canvas;

        // Gradiente dinâmico
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#4facfe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Adicionar estrelas e faíscas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 4 + 2;
          this.drawStar(ctx, x, y, size);
        }

        // Linhas dinâmicas diagonais
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(-50, height * (i / 8));
          ctx.lineTo(width + 50, height * (i / 8) + 100);
          ctx.stroke();
        }
      }
    };
  }

  async createGratitudeTemplate(ctx, canvas) {
    return {
      theme: { colors: ['#f093fb', '#f5576c', '#ff9a9e'], emoji: '🙏', accent: '#ff6b9d' },
      text: '🙏 Gratidão 🙏',
      draw: async () => {
        const { width, height } = canvas;

        // Gradiente suave
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#f093fb');
        gradient.addColorStop(0.5, '#f5576c');
        gradient.addColorStop(1, '#ff9a9e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Padrão de mandalas/florais
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = 100 + i * 20;

          ctx.beginPath();
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (angle === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }

        // Adicionar elementos florais
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          this.drawFlower(ctx, x, y, 15);
        }
      }
    };
  }

  async createDefaultTemplate(ctx, canvas) {
    return {
      theme: { colors: ['#4facfe', '#00f2fe', '#43e97b'], emoji: '✨', accent: '#38f9d7' },
      text: '✨ Inspiração ✨',
      draw: async () => {
        const { width, height } = canvas;

        // Gradiente moderno
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#4facfe');
        gradient.addColorStop(0.5, '#00f2fe');
        gradient.addColorStop(1, '#43e97b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Padrão geométrico abstrato
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 25; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 60 + 20;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.random() * Math.PI * 2);
          ctx.fillRect(-size/2, -size/2, size, size);
          ctx.restore();
        }
      }
    };
  }

  getDefaultImage() {
    this.agentStatus.log('Gerando imagem padrão avançada');
    try {
      const canvas = createCanvas(1080, 1920);
      const ctx = canvas.getContext('2d');

      // Gradiente padrão moderno
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
      gradient.addColorStop(0, '#4facfe');
      gradient.addColorStop(0.5, '#00f2fe');
      gradient.addColorStop(1, '#43e97b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Elementos decorativos
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 1080;
        const y = Math.random() * 1920;
        const size = Math.random() * 40 + 20;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Texto padrão
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText('✨', 540, 400);

      ctx.font = 'bold 60px Arial';
      ctx.fillText('Agente de IA', 540, 600);

      ctx.font = '40px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Redes Sociais', 540, 720);

      const imagePath = path.join(this.generatedDir, 'default.png');
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(imagePath, buffer);

      return imagePath;
    } catch (error) {
      this.agentStatus.log(`Erro ao gerar imagem padrão avançada: ${error.message}`);
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
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
          '-pix_fmt', 'yuv420p',
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

  addMainText(ctx, text, canvas) {
    const { width, height } = canvas;

    // Emoji grande
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 150px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    ctx.fillText(text.split(' ')[0], width / 2, height * 0.3);

    // Texto principal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.fillText(text, width / 2, height * 0.5);

    // Subtítulo
    ctx.font = '36px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Conteúdo Inspirador', width / 2, height * 0.65);
  }

  addDecorativeElements(ctx, canvas, theme) {
    const { width, height } = canvas;

    // Adicionar elementos temáticos
    ctx.fillStyle = theme.accent || 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.8 + height * 0.2; // Só na parte inferior
      const size = Math.random() * 20 + 10;

      if (theme.emoji === '💕') {
        this.drawHeart(ctx, x, y, size);
      } else if (theme.emoji === '🚀') {
        this.drawStar(ctx, x, y, size);
      } else if (theme.emoji === '🙏') {
        this.drawFlower(ctx, x, y, size);
      } else {
        // Círculos para tema padrão
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  addTimestamp(ctx, canvas) {
    const { width, height } = canvas;
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    ctx.fillText(`Gerado em ${timestamp}`, width / 2, height - 50);
  }

  drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100);

    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.bezierCurveTo(0, 15, -30, 0, -30, -15);
    ctx.bezierCurveTo(-30, -30, 0, -45, 0, -45);
    ctx.bezierCurveTo(0, -45, 30, -30, 30, -15);
    ctx.bezierCurveTo(30, 0, 0, 15, 0, 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawStar(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 50, size / 50);

    ctx.beginPath();
    ctx.moveTo(0, -25);
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((i * 4 * Math.PI) / 5 - Math.PI / 2) * 15, Math.sin((i * 4 * Math.PI) / 5 - Math.PI / 2) * 15);
      ctx.lineTo(Math.cos((i * 4 * Math.PI) / 5 + Math.PI - Math.PI / 2) * 25, Math.sin((i * 4 * Math.PI) / 5 + Math.PI - Math.PI / 2) * 25);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawFlower(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // Centro da flor
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Pétalas
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(i * Math.PI / 3) * size * 0.6,
        Math.sin(i * Math.PI / 3) * size * 0.6,
        size * 0.4,
        size * 0.2,
        i * Math.PI / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }
}

module.exports = AIManager;
