require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cron = require('node-cron');

const AgentStatus = require('./agentStatus');
const ConfigManager = require('./configManager');
const AIManager = require('./aiManager');
const { runAutomation, NETWORKS } = require('./socialMedia');
const { launchBrowser, saveCookies, loadCookies, clearCookies } = require('./services/browserUtils');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// Instâncias
const configManager = new ConfigManager();
const agentStatus = new AgentStatus(io);
const aiManager = new AIManager(agentStatus, configManager);

let isPaused = false;
const connectedClients = new Set();

// WebSocket
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  connectedClients.add(socket.id);
  agentStatus.log(`Cliente conectado: ${connectedClients.size} conexão(ões)`);

  // Enviar status actual
  agentStatus.broadcastStatus();
  socket.emit('settings-data', configManager.config);

  socket.on('request-status', () => {
    agentStatus.broadcastStatus();
  });

  socket.on('request-settings', () => {
    socket.emit('settings-data', configManager.config);
  });

  socket.on('test-post', async () => {
    if (isPaused) {
      agentStatus.log('Agente pausado. Retome para testar.');
      return;
    }
    agentStatus.updateStatus('working', 'Testando postagem');
    try {
      await postDailyContent();
      agentStatus.updateStatus('idle', 'Nenhuma');
    } catch (error) {
      agentStatus.log(`Erro no teste: ${error.message}`);
      agentStatus.updateStatus('idle', 'Nenhuma');
    }
  });

  socket.on('pause-agent', () => {
    isPaused = true;
    agentStatus.updateStatus('paused', 'Agente pausado');
    agentStatus.log('Agente pausado pelo usuário');
  });

  socket.on('resume-agent', () => {
    isPaused = false;
    agentStatus.updateStatus('idle', 'Nenhuma');
    agentStatus.log('Agente retomado pelo usuário');
  });

  socket.on('connect-network', async (data) => {
    const networkKey = data.network;
    const network = NETWORKS.find(item => item.sessionId === networkKey);

    if (!network) {
      socket.emit('connect-status', { status: `Rede ${networkKey} não encontrada` });
      return;
    }

    agentStatus.log(`Iniciando processo de conexão para ${network.name}`);
    socket.emit('connect-status', { status: `Abrindo navegador para ${network.name}...` });

    let browser;

    try {
      browser = await launchBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await loadCookies(page, network.sessionId);

      await page.goto(network.url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 3000));

      let isLoggedIn = await network.checkLogin(page);
      if (!isLoggedIn) {
        socket.emit('connect-status', { status: `Aguardando login manual no ${network.name}...` });

        const startTime = Date.now();
        const maxWait = 180000;

        while (Date.now() - startTime < maxWait && !isLoggedIn) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          isLoggedIn = await network.checkLogin(page);
        }
      }

      if (!isLoggedIn) {
        socket.emit('connect-status', { status: `Não foi possível conectar no ${network.name}. Tente novamente.` });
        agentStatus.log(`❌ Login não realizado no ${network.name}`);
        agentStatus.setLoginStatus(network.name, false);
        return;
      }

      agentStatus.log(`✅ Logado no ${network.name}`);
      agentStatus.setLoginStatus(network.name, true);
      socket.emit('connect-status', { status: `Conectado no ${network.name}! Salvando sessão...` });
      await saveCookies(page, network.sessionId);
      agentStatus.log(`💾 Cookies salvos para ${network.name}`);
      socket.emit('connect-status', { status: `Sessão salva para ${network.name}. Pronto para postar.` });
    } catch (error) {
      agentStatus.log(`Erro ao conectar ${network.name}: ${error.message}`);
      socket.emit('connect-status', { status: `Erro ao conectar no ${network.name}: ${error.message}` });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });

  socket.on('generate-preview', async (payload) => {
    const { imagePrompt, videoPrompt, caption } = payload;
    agentStatus.log('Gerando prévia de conteúdo...');
    agentStatus.updateStatus('working', 'Gerando prévia');

    try {
      const prompt = imagePrompt || caption || 'Imagem inspiradora com tema bíblico';
      const imagePath = await aiManager.generateImage(prompt);
      const videoPath = await aiManager.generateVideo(imagePath, videoPrompt || prompt);
      const description = caption || await aiManager.generateText(prompt);

      const imageUrl = `/generated/${path.basename(imagePath)}`;
      const videoUrl = `/generated/${path.basename(videoPath)}`;

      socket.emit('preview-ready', {
        imageUrl,
        videoUrl,
        caption: description,
        prompt: prompt
      });

      agentStatus.log('Prévia pronta');
      agentStatus.updateStatus('idle', 'Nenhuma');
    } catch (error) {
      agentStatus.log(`Erro ao gerar prévia: ${error.message}`);
      socket.emit('preview-error', { message: error.message });
      agentStatus.updateStatus('idle', 'Nenhuma');
    }
  });

  socket.on('post-now', async (payload) => {
    const { imagePrompt, videoPrompt, caption } = payload;
    agentStatus.log('Iniciando postagem direta...');
    agentStatus.updateStatus('working', 'Postando agora');

    try {
      const prompt = imagePrompt || caption || 'Imagem inspiradora com tema bíblico';
      const imagePath = await aiManager.generateImage(prompt);
      const videoPath = await aiManager.generateVideo(imagePath, videoPrompt || prompt);
      const description = caption || await aiManager.generateText(prompt);

      await runAutomation(imagePath, videoPath, description, agentStatus);
      agentStatus.updateStatus('idle', 'Nenhuma');
      agentStatus.log('Postagem direta concluída');
    } catch (error) {
      agentStatus.log(`Erro ao postar direto: ${error.message}`);
      agentStatus.updateStatus('idle', 'Nenhuma');
    }
  });

  socket.on('update-settings', (settings) => {
    configManager.save(settings);
    agentStatus.log(`Configurações atualizadas com sucesso`);
    // Notificar todos os clientes
    io.emit('settings-updated', settings);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    connectedClients.delete(socket.id);
    agentStatus.log(`Cliente desconectado: ${connectedClients.size} conexão(ões) ativas`);
  });
});

// Função para postar conteúdo
async function postDailyContent() {
  if (isPaused) {
    agentStatus.log('Postagem agnedada pulada (agente pausado)');
    return;
  }

  agentStatus.updateStatus('working', 'Gerando conteúdo');
  agentStatus.updateTask('Gerando imagem...', 25);

  try {
    // Gerar versículo
    const verses = [
      "João 3:16 - Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
      "Salmo 23:1 - O Senhor é o meu pastor; nada me faltará.",
      "Mateus 6:33 - Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.",
      "Romanos 5:8 - Mas Deus prova o seu amor para conosco pelo fato de morrer Cristo por nós quando ainda éramos pecadores.",
      "Filipenses 4:13 - Posso todas as coisas em Cristo que me fortalece."
    ];
    const verse = verses[Math.floor(Math.random() * verses.length)];
    agentStatus.log(`Versículo selecionado: ${verse.substring(0, 50)}...`);

    // Gerar imagem
    agentStatus.updateTask('Gerando imagem...', 25);
    const imageUrl = await aiManager.generateImage(verse);
    agentStatus.updateTask('Gerando vídeo...', 50);

    // Gerar vídeo
    const videoPath = await aiManager.generateVideo(imageUrl, verse);
    agentStatus.updateTask('Gerando descrição...', 75);

    // Gerar texto
    const description = await aiManager.generateText(verse);
    agentStatus.updateTask('Postando nas redes...', 85);

    // Postar
    agentStatus.log('Iniciando automação das redes sociais');
    await runAutomation(imageUrl, videoPath, description, agentStatus);

    agentStatus.updateStatus('idle', 'Nenhuma');
    agentStatus.updateTask('Pronto', 100, 'Postagem concluída com sucesso!');
    agentStatus.log('Postagem concluída!');

  } catch (error) {
    agentStatus.log(`Erro ao postar: ${error.message}`);
    agentStatus.updateStatus('idle', 'Nenhuma');
  }

  // Atualizar próximas postagens
  updateNextPosts();
}

function updateNextPosts() {
  const times = ['3:00 AM', '6:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM', '12:00 AM'];
  const posts = times.map(time => ({
    time,
    status: isPaused ? 'Pausado' : 'Agendado'
  }));
  agentStatus.setNextPosts(posts);
}

// Agendar postagens diárias
cron.schedule('0 3,6,9,12,15,18,21,0 * * *', () => {
  agentStatus.log('Hora de postar!');
  postDailyContent();
});

// Para teste manual
cron.schedule('*/2 * * * *', () => {
  updateNextPosts();
});

updateNextPosts();

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🤖 Servidor iniciado em http://localhost:${PORT}`);
  agentStatus.log('Servidor iniciado');
  agentStatus.updateStatus('idle', 'Nenhuma');
});