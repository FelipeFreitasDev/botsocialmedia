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

      const lowerPrompt = prompt.toLowerCase();

      // Selecionar tema baseado no prompt
      let theme;
      if (lowerPrompt.includes('amor') || lowerPrompt.includes('romântico') || lowerPrompt.includes('frase de amor')) {
        theme = {
          bg: ['#ff6b9d', '#c44569'],
          text: '#ffffff',
          title: '💕 Amor Verdadeiro 💕',
          subtitle: 'Frases que aquecem o coração',
          emoji: '❤️'
        };
      } else if (lowerPrompt.includes('motivação') || lowerPrompt.includes('inspiração') || lowerPrompt.includes('força')) {
        theme = {
          bg: ['#667eea', '#764ba2'],
          text: '#ffffff',
          title: '💪 Força Interior 💪',
          subtitle: 'Motivação para vencer desafios',
          emoji: '🚀'
        };
      } else if (lowerPrompt.includes('gratidão') || lowerPrompt.includes('obrigado')) {
        theme = {
          bg: ['#f093fb', '#f5576c'],
          text: '#ffffff',
          title: '🙏 Gratidão 🙏',
          subtitle: 'Agradecendo pelas bênçãos',
          emoji: '🌟'
        };
      } else {
        // Tema padrão
        theme = {
          bg: ['#4facfe', '#00f2fe'],
          text: '#ffffff',
          title: prompt.substring(0, 30),
          subtitle: 'Conteúdo Inspirador',
          emoji: '✨'
        };
      }

      // Criar gradiente
      const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
      gradient.addColorStop(0, theme.bg[0]);
      gradient.addColorStop(1, theme.bg[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      // Adicionar efeitos decorativos
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const r = Math.random() * 200 + 50;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Emoji grande no centro
      ctx.fillStyle = theme.text;
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.fillText(theme.emoji, 512, 350);

      // Título
      ctx.fillStyle = theme.text;
      ctx.font = 'bold 48px Arial';
      ctx.fillText(theme.title, 512, 500);

      // Subtítulo
      ctx.font = '32px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(theme.subtitle, 512, 580);

      // Timestamp
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const timestamp = new Date().toLocaleTimeString('pt-BR');
      ctx.fillText(`Gerado em ${timestamp}`, 512, 900);

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
