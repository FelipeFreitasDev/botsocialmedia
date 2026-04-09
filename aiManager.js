const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AIManager {
  constructor(agentStatus, configManager) {
    this.agentStatus = agentStatus;
    this.configManager = configManager;
    this.generatedDir = path.join(__dirname, 'generated');
    if (!fs.existsSync(this.generatedDir)) {
      fs.mkdirSync(this.generatedDir, { recursive: true });
    }
  }

  // Gerar imagens com IA (Pollinations.ai) como primeira opção
  async generateImage(prompt) {
    this.agentStatus.setAIToolStatus('image-primary', 'loading');

    // Tentar IA generativa primeiro (Pollinations.ai - 100% gratuita, sem limite)
    try {
      const imagePath = await this.generateAIImage(prompt);
      this.agentStatus.setAIToolStatus('image-primary', 'success', 'AI Generated (Free)');
      this.agentStatus.log(`Imagem gerada com IA`);
      return imagePath;
    } catch (error) {
      this.agentStatus.log(`Falha na geração com IA: ${error.message}. Tentando banco de imagens...`);
    }

    // Fallback: tentar banco de imagens gratuitas
    try {
      const imagePath = await this.fetchFreeImage(prompt);
      this.agentStatus.setAIToolStatus('image-primary', 'success', 'Stock Image (Free)');
      this.agentStatus.log(`Imagem obtida de fonte gratuita`);
      return imagePath;
    } catch (error) {
      this.agentStatus.log(`Falha ao obter imagem de banco: ${error.message}. Usando geração local.`);
    }

    // Último recurso: gerar localmente com Canvas
    try {
      const imagePath = await this.generateLocalImage(prompt);
      this.agentStatus.setAIToolStatus('image-primary', 'success', 'Generated (Local)');
      this.agentStatus.log(`Imagem gerada localmente`);
      return imagePath;
    } catch (error) {
      this.agentStatus.log(`Erro ao gerar imagem local: ${error.message}`);
      return this.getDefaultImage();
    }
  }

  // Gerar imagem com Pollinations.ai (API 100% gratuita, sem chave/token)
  async generateAIImage(prompt) {
    try {
      this.agentStatus.log(`Gerando imagem com IA sobre: "${prompt.substring(0, 50)}..."`);
      
      // URL com encoding correto para Pollinations.ai
      const cleanPrompt = prompt.replace(/[^\w\s\-]/g, '').trim();
      const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*'
        },
        timeout: 60000
      });

      if (!response.ok) {
        throw new Error(`IA respondeu com status ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Validar se é uma imagem válida
      if (buffer.length < 5000) {
        throw new Error('Imagem gerada muito pequena ou inválida');
      }

      const imagePath = path.join(this.generatedDir, `ai-${Date.now()}.png`);
      fs.writeFileSync(imagePath, buffer);
      this.agentStatus.log(`✨ Imagem gerada com sucesso pela IA`);
      
      return imagePath;
    } catch (error) {
      throw new Error(`Erro ao gerar imagem com IA: ${error.message}`);
    }
  }

  async fetchFreeImage(prompt) {
    const keyword = prompt.trim().toLowerCase().replace(/[\s,/]+/g, '+');
    const imageSource = this.configManager?.get('imageSource') || 'both';
    
    // Definir fontes com base na configuração, com fallback automático
    const sources = [];
    
    if (imageSource === 'unsplash' || imageSource === 'both') {
      sources.push({
        name: 'unsplash',
        url: `https://source.unsplash.com/1080x1920/?${encodeURIComponent(keyword)}`
      });
    }
    
    if (imageSource === 'loremflickr' || imageSource === 'both') {
      sources.push({
        name: 'loremflickr',
        url: `https://loremflickr.com/1080/1920/${encodeURIComponent(keyword)}`
      });
    }
    
    // Sempre adicionar Pexels como terceira opção de fallback
    sources.push({
      name: 'pexels',
      url: `https://images.pexels.com/search/${encodeURIComponent(prompt)}/?auto=compress&cs=tinysrgb&fit=max&w=1080&h=1920`
    });

    if (sources.length === 0) {
      throw new Error('Nenhuma fonte de imagem configurada');
    }

    let lastError = null;
    for (const source of sources) {
      try {
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Resposta HTTP ${response.status}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 1000) {
          throw new Error('Imagem muito pequena ou vazia');
        }

        const imagePath = path.join(this.generatedDir, `${Date.now()}.jpg`);
        fs.writeFileSync(imagePath, buffer);
        this.agentStatus.log(`Imagem carregada com sucesso (tentativa ${sources.indexOf(source) + 1})`);
        return imagePath;
      } catch (error) {
        lastError = error;
        this.agentStatus.log(`Fonte ${source.name} não disponível, tentando próxima...`);
      }
    }

    throw lastError || new Error('Nenhuma fonte de imagem respondeu corretamente');
  }

  async generateLocalImage(prompt) {
    try {
      const canvas = createCanvas(1080, 1920); // Formato vertical para redes sociais
      const ctx = canvas.getContext('2d');

      const lowerPrompt = prompt.toLowerCase();

      // Selecionar template baseado no prompt
      let template;
      if (lowerPrompt.includes('amor') || lowerPrompt.includes('romântico') || lowerPrompt.includes('frase de amor')) {
        template = await this.createLoveTemplate(ctx, canvas);
      } else if (lowerPrompt.includes('motivação') || lowerPrompt.includes('inspiração') || lowerPrompt.includes('força')) {
        template = await this.createMotivationTemplate(ctx, canvas);
      } else if (lowerPrompt.includes('gratidão') || lowerPrompt.includes('obrigado')) {
        template = await this.createGratitudeTemplate(ctx, canvas);
      } else if (lowerPrompt.includes('bem estar') || lowerPrompt.includes('bem-estar') || lowerPrompt.includes('saúde') || lowerPrompt.includes('relaxamento') || lowerPrompt.includes('paz')) {
        template = await this.createWellnessTemplate(ctx, canvas);
      } else {
        template = await this.createDefaultTemplate(ctx, canvas);
      }

      // Aplicar template
      await template.draw();

      // Adicionar texto principal
      this.addMainText(ctx, template.text, canvas);

      // Adicionar elementos decorativos
      this.addDecorativeElements(ctx, canvas, template.theme);

      // Adicionar timestamp sutil
      this.addTimestamp(ctx, canvas);

      // Salvar imagem
      const imagePath = path.join(this.generatedDir, `${Date.now()}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(imagePath, buffer);

      return imagePath;
    } catch (error) {
      throw new Error(`Erro ao gerar imagem avançada: ${error.message}`);
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

  async createWellnessTemplate(ctx, canvas) {
    return {
      theme: { colors: ['#a8e6cf', '#dcedc8', '#ffd3a5'], emoji: '🧘', accent: '#52c234' },
      text: '🧘 Bem-Estar 🧘',
      draw: async () => {
        const { width, height } = canvas;

        // Gradiente calmo e natural
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#a8e6cf');
        gradient.addColorStop(0.5, '#dcedc8');
        gradient.addColorStop(1, '#ffd3a5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Padrão de ondas suaves (como água calma)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        for (let y = 0; y < height; y += 80) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x < width; x += 30) {
            ctx.lineTo(x, y + Math.sin(x * 0.008) * 20);
          }
          ctx.stroke();
        }

        // Adicionar elementos de natureza (folhas, flores)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          if (i % 3 === 0) {
            this.drawLeaf(ctx, x, y, 20);
          } else {
            this.drawFlower(ctx, x, y, 12);
          }
        }

        // Círculos concêntricos para meditação
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 1; i <= 5; i++) {
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 50 + i * 30, 0, Math.PI * 2);
          ctx.stroke();
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

      // Texto padrão - neutro, sem expor automação
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText('✨', 540, 400);

      ctx.font = 'bold 60px Arial';
      ctx.fillText('Conteúdo', 540, 600);

      ctx.font = '40px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Exclusivo', 540, 720);

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
      } else if (theme.emoji === '🧘') {
        this.drawLeaf(ctx, x, y, size);
      } else {
        // Círculos para tema padrão
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  addTimestamp(ctx, canvas) {
    // Removido: não adicionar marcas de geração/automação nas imagens
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

  drawLeaf(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 50, size / 50);

    ctx.fillStyle = ctx.fillStyle; // Usar a cor atual
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.bezierCurveTo(-15, -25, -25, -10, -25, 0);
    ctx.bezierCurveTo(-25, 10, -15, 25, 0, 25);
    ctx.bezierCurveTo(15, 25, 25, 10, 25, 0);
    ctx.bezierCurveTo(25, -10, 15, -25, 0, -25);
    ctx.closePath();
    ctx.fill();

    // Veia central
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(0, 25);
    ctx.stroke();

    ctx.restore();
  }

  async generateLocalText(verse) {
    const lowerVerse = verse.toLowerCase();

    // Detectar tipo de conteúdo baseado no prompt
    if (lowerVerse.includes('amor') || lowerVerse.includes('romântico') || lowerVerse.includes('frase de amor')) {
      // Frases de amor originais
      const lovePhrases = [
        "O amor é a força que move o mundo e aquece o coração. 💕",
        "Cada dia ao seu lado é uma nova página de felicidade. ❤️",
        "O verdadeiro amor não conhece barreiras, apenas conexões profundas. 💑",
        "Você é a razão do meu sorriso todos os dias. 😊❤️",
        "O amor verdadeiro é aquele que cresce com o tempo. 🌹",
        "Em seus braços encontro a paz que sempre busquei. 🕊️",
        "O amor é a linguagem universal do coração. 💖",
        "Juntos construímos memórias que durarão para sempre. 📸❤️",
        "Seu amor ilumina os meus dias mais escuros. ✨",
        "O amor não se mede em palavras, mas em sentimentos. 💕"
      ];
      return lovePhrases[Math.floor(Math.random() * lovePhrases.length)];
    }

    if (lowerVerse.includes('motivação') || lowerVerse.includes('inspiração') || lowerVerse.includes('força')) {
      // Frases motivacionais
      const motivationPhrases = [
        "Acredite em si mesmo e tudo será possível! 💪",
        "Cada desafio é uma oportunidade de crescimento. 🌱",
        "Sua determinação é maior que qualquer obstáculo. 🏔️",
        "O sucesso começa com um passo corajoso. 👣",
        "Você tem o poder de transformar seus sonhos em realidade. ✨",
        "Nunca desista dos seus objetivos. Persistência vence tudo! 🎯",
        "Sua força interior é infinita. Confie nela! 💎",
        "Cada dia é uma nova chance de brilhar. ☀️",
        "Você é capaz de alcançar tudo que deseja. 🚀",
        "A motivação vem de dentro, acredite no seu potencial! 🔥"
      ];
      return motivationPhrases[Math.floor(Math.random() * motivationPhrases.length)];
    }

    if (lowerVerse.includes('gratidão') || lowerVerse.includes('obrigado') || lowerVerse.includes('agradecimento')) {
      // Frases de gratidão
      const gratitudePhrases = [
        "A gratidão transforma o que temos em suficiente. 🙏",
        "Obrigado pela vida e por todas as bênçãos recebidas. 🌟",
        "A gratidão é a chave para uma vida plena. 💝",
        "Valorize cada momento e cada pessoa ao seu lado. ❤️",
        "A gratidão abre portas para mais felicidade. 🚪✨",
        "Obrigado pelo amor, pela amizade e por tudo que me completa. 💕",
        "A gratidão é o melhor presente que podemos dar. 🎁",
        "Cada dia é uma oportunidade de agradecer. 🌅",
        "Obrigado pela força e pela determinação que me guiam. 💪",
        "A gratidão transforma desafios em lições valiosas. 📚"
      ];
      return gratitudePhrases[Math.floor(Math.random() * gratitudePhrases.length)];
    }

    if (lowerVerse.includes('bem estar') || lowerVerse.includes('bem-estar') || lowerVerse.includes('saúde') || lowerVerse.includes('relaxamento') || lowerVerse.includes('paz') || lowerVerse.includes('meditação')) {
      // Frases de bem-estar
      const wellnessPhrases = [
        "O bem-estar começa com pequenos momentos de paz interior. 🧘",
        "Cuide da sua mente, corpo e espírito todos os dias. 🌸",
        "A paz interior é o maior presente que você pode dar a si mesmo. ✨",
        "Pratique o autocuidado diariamente para uma vida plena. 💆",
        "Sua saúde mental é tão importante quanto a física. 🧠❤️",
        "Encontre equilíbrio entre trabalho e descanso. ⚖️",
        "Respire fundo e deixe a tranquilidade te envolver. 🌊",
        "O relaxamento é essencial para recarregar as energias. 🔋",
        "Dedique tempo para cuidar da sua alma. 🌟",
        "O bem-estar é uma jornada, não um destino. 🛤️"
      ];
      return wellnessPhrases[Math.floor(Math.random() * wellnessPhrases.length)];
    }

    // Para outros tipos, usar templates genéricos
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
