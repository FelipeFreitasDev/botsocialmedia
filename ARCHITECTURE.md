# 🏗️ Arquitetura do Sistema

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD WEB (Frontend)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  public/index.html      - Interface gráfica             │   │
│  │  public/style.css       - Estilos                        │   │
│  │  public/dashboard.js    - Lógica do frontend            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                │                                      │
                │ WebSocket (Socket.io)                │
                │ tempo real                           │
                ↓                                      ↓
┌──────────────────────────────────────────────────────────────────┐
│                   SERVIDOR (Backend)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  server.js                                               │   │
│  │  ├─ Express (servidor HTTP)                            │   │
│  │  ├─ Socket.io (conexão tempo real)                     │   │
│  │  └─ Node-cron (agendamento diário)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  agentStatus.js - Gerenciador de Status                │   │
│  │  ├─ Status atual (idle, working, paused)              │   │
│  │  ├─ Tarefas em execução                                │   │
│  │  ├─ Status de login (4 redes sociais)                 │   │
│  │  ├─ Status das ferramentas de IA                       │   │
│  │  └─ Log de atividades                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  aiManager.js - Orquestrador de IA com Fallbacks       │   │
│  │                                                          │   │
│  │  generateImage(prompt)                                  │   │
│  │  ├─ Try: Hugging Face                                 │   │
│  │  ├─ Fallback: Stability AI                            │   │
│  │  └─ Fallback: OpenAI DALL-E                           │   │
│  │                                                          │   │
│  │  generateText(verse)                                    │   │
│  │  ├─ Try: Ollama (local)                               │   │
│  │  └─ Fallback: OpenAI GPT                              │   │
│  │                                                          │   │
│  │  generateVideo(imagePath)                              │   │
│  │  └─ FFmpeg (local)                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  socialMedia.js - Automação de Redes Sociais           │   │
│  │  ├─ Puppeteer (automação web)                         │   │
│  │  ├─ Login automático com cookies                       │   │
│  │  ├─ Suporte: Facebook, Instagram, Pinterest, TikTok  │   │
│  │  └─ Postagens automáticas                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  contentGenerator.js - Base de Conteúdo                │   │
│  │  └─ Array de versículos bíblicos                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                │         │         │         │
                ↓         ↓         ↓         ↓
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Hugging  │  │Stability │  │ OpenAI   │  │ Ollama   │
    │  Face    │  │   AI     │  │  (GPT)   │  │ (Local)  │
    │Gratuito  │  │Free Tier │  │Free Trial│  │Gratuito  │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘
         │              │            │            │
         └──────────────┴────────────┴────────────┘
                        ↓
    ┌──────────────────────────────────────────┐
    │    Geração de Imagens/Vídeos/Texto       │
    └──────────────────────────────────────────┘
                        ↓
    ┌──────────────────────────────────────────┐
    │    Arquivos Salvos Localmente            │
    │    d:\SaaS\generated\                    │
    │    ├─ {timestamp}.png (imagens)          │
    │    └─ {timestamp}.mp4 (vídeos)           │
    └──────────────────────────────────────────┘
                        ↓
    ┌───────────────────────────────────────────────────────────┐
    │        Automação de Redes Sociais (Puppeteer)             │
    │  ┌────────────┬────────────┬────────────┬────────────┐   │
    │  │ Facebook   │ Instagram  │ Pinterest  │  TikTok    │   │
    │  └────────────┴────────────┴────────────┴────────────┘   │
    └───────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados

### 1. Agendamento (Cron Job)

```
Node-cron verifica a hora
        ↓
Se é 3h, 6h, 9h, 12h, 15h, 18h, 21h ou 0h
        ↓
postDailyContent() é acionada
```

### 2. Geração de Conteúdo

```
Selecionar versículo aleatório
        ↓
AIManager.generateImage(verse)
├─ Tenta: Hugging Face
├─ Fallback: Stability AI
└─ Fallback: OpenAI
        ↓
AIManager.generateVideo(imagePath)
└─ FFmpeg cria vídeo de 15s
        ↓
AIManager.generateText(verse)
├─ Tenta: Ollama (local)
└─ Fallback: OpenAI
        ↓
Salvar em d:\SaaS\generated\
```

### 3. Automação de Rede Social

```
runAutomation(imageUrl, videoPath, verse)
        ↓
Para cada rede (Facebook, Instagram, Pinterest, TikTok)
├─ Carregar cookies (se existem)
├─ Abrir navegador
├─ Verificar se está logado
├─ Tentar postar (quando implementado)
└─ Salvar cookies
        ↓
AgentStatus.log() atualiza dashboard
```

### 4. Comunicação em Tempo Real

```
Mudança no AgentStatus
        ↓
.broadcastStatus() ou .log()
        ↓
Socket.io emite para todos os clientes conectados
        ↓
dashboard.js recebe e atualiza UI
```

---

## Componentes Principais

### 1. Server.js
- **Porta:** 3000
- **Funções:**
  - Servir arquivos estáticos (public/)
  - Manter conexão WebSocket
  - Executar agendamentos (cron)
  - Coordenar fluxo geral
- **Responsabilidades:**
  ```javascript
  app.use(express.static())    // Frontend
  io.on('connection')          // Conexões WebSocket
  cron.schedule()              // Agendamento
  server.listen(PORT)          // Iniciar
  ```

### 2. AIManager.js
- **Função:** Orquestrar geração de conteúdo com fallbacks
- **Métodos:**
  ```javascript
  generateImage(prompt)        // Com 3 fallbacks
  generateWithHuggingFace()   // Primário
  generateWithStabilityAI()   // Fallback 1
  generateWithOpenAI()        // Fallback 2
  
  generateVideo(imagePath)    // FFmpeg
  generateText(verse)         // Com 2 fallbacks
  ```
- **Lógica:**
  ```
  Tentar ferramenta 1
  └─ Se erro, tentar ferramenta 2
     └─ Se erro, tentar ferramenta 3
        └─ Se erro, usar padrão
  ```

### 3. AgentStatus.js
- **Função:** Centralizar e sincronizar estado
- **Propriedades:**
  - `status`: 'idle' | 'working' | 'paused'
  - `currentTask`: String
  - `progress`: 0-100%
  - `loginStatus`: { facebook, instagram, pinterest, tiktok }
  - `aiTools`: { tool -> status, provider }
- **Métodos:**
  - `updateStatus(status, task)`
  - `updateTask(task, progress, message)`
  - `setLoginStatus(network, logged)`
  - `setAIToolStatus(tool, status, provider)`
  - `log(message)`
  - `broadcastStatus()` -> Socket.io

### 4. SocialMedia.js
- **Função:** Ser a interface com redes sociais
- **Tecnologia:** Puppeteer (automação de navegador)
- **Processo:**
  1. Abrir navegador
  2. Carregar cookies de sessão anterior
  3. Para cada rede social:
     - Navegar para URL
     - Verificar se está logado
     - Postar (quando implementado)
     - Salvar cookies
  4. Fechar navegador
- **Estrutura:**
  ```javascript
  async function runAutomation(
    imageUrl,      // Caminho local da imagem
    videoPath,     // Caminho local do vídeo
    verse,         // Texdo do versículo
    agentStatus    // Para logs
  )
  ```

### 5. Dashboard.js (Frontend)
- **Função:** Conectar UI com servidor
- **Tecnologia:** Socket.io client
- **Eventos Recebidos:**
  - `agent-status` -> Atualizar status
  - `task-update` -> Atualizar tarefa e progresso
  - `login-status` -> Atualizar rede social
  - `ai-tool-status` -> Atualizar ferramenta
  - `new-log` -> Adicionar ao log
  - `next-posts-update` -> Atualizar horários
- **Eventos Enviados:**
  - `test-post` -> Testar postagem
  - `pause-agent` -> Pausar
  - `resume-agent` -> Retomar
  - `request-status` -> Pedir status

---

## Fluxo Completo por Horário

```
00:00:00
    ↓
Cron detecta hora de postagem
    ↓
postDailyContent() inicia
    ↓
AgentStatus.updateStatus('working', 'Gerando conteúdo')
    ↓
Emite 'agent-status' via Socket.io
    ↓
Dashboard recebe e atualiza UI
    │
    ├─ Selecion aleatório de versículo
    │  └─ Log: "Versículo selecionado..."
    │
    ├─ AIManager.generateImage()
    │  ├─ Tenta Hugging Face
    │  └─ Se erro, tenta alternativas
    │  └─ Log: "Imagem gerada com [ferramenta]"
    │
    ├─ AIManager.generateVideo()
    │  └─ FFmpeg cria vídeo
    │  └─ Log: "Vídeo gerado"
    │
    ├─ AIManager.generateText()
    │  ├─ Tenta Ollama
    │  └─ Se erro, tenta OpenAI
    │  └─ Log: "Texto gerado com [ferramenta]"
    │
    └─ runAutomation()
       ├─ Abre Puppeteer
       ├─ Para cada rede:
       │  ├─ Carregar cookies
       │  ├─ Verificar login
       │  ├─ Postar (futuro)
       │  └─ Salvar cookies
       ├─ Fechar navegador
       └─ Log: "Postagem concluída!"
    ↓
AgentStatus.updateStatus('idle', 'Nenhuma')
    ↓
Dashboard mostra "Conectado" novamente
    ↓
Próxima postagem em 3 horas
```

---

## Fallback System

### Exemplo: Gerar Imagem for Versículo

```
Usuário clica "Testar Postagem"
         ↓
generateImage("João 3:16...")
         ↓
OPÇÃO 1: Hugging Face
├─ Checar env: HUGGINGFACE_API_KEY
├─ Fazer requisição
├─ Se sucesso → Salvar e retornar
└─ Se erro → Ir para OPÇÃO 2

OPÇÃO 2: Stability AI  
├─ Checar env: STABILITY_API_KEY
├─ Fazer requisição
├─ Se sucesso → Salvar e retornar
└─ Se erro → Ir para OPÇÃO 3

OPÇÃO 3: OpenAI DALL-E
├─ Checar env: OPENAI_API_KEY
├─ Fazer requisição
├─ Se sucesso → Salvar e retornar
└─ Se erro → Ir para OPÇÃO 4

OPÇÃO 4: Imagem Padrão
└─ Retornar path de imagem genérica
   (d:\SaaS\assets\default-image.png)
```

**Vantagem:** Se uma ferramenta fica sem tokens/créditos, a próxima automáticamente toma conta.

---

## Sincronização em Tempo Real

### Como o Dashboard Sabe do Progresso?

```
Servidor (server.js)              Cliente (dashboard.js)
    │                                     │
    │ agentStatus.updateTask()            │
    │ agentStatus.log()                   │
    │                                     │
    ├─ io.emit('task-update', data) ────→ │
    │                                     │
    │                            socket.on('task-update')
    │                                  ↓
    │                          updateProgress()
    │                          addLog()
    │                          updateUI()
    │
    └─ Isso acontece em tempo real (< 100ms)
```

---

## Diretório de Arquivos

```
d:\SaaS\
├── server.js                 # Arquivo principal
├── agentStatus.js           # Gerenciador de estado
├── aiManager.js             # Orquestrador de IA
├── socialMedia.js           # Automação de redes
├── contentGenerator.js      # Base de versículos
├── package.json             # Dependências
├── .env                     # Configurações (não commitar)
├── .env.example             # Exemplo
├── .gitignore              # O que ignorar no Git
├── cookies.json            # Cookies salvos (não commitar)
├── generated/              # Imagens/vídeos gerados
│   ├── 1234567890.png     # Imagens
│   └── 1234567890.mp4     # Vídeos
├── public/                 # Frontend
│   ├── index.html         # HTML principal
│   ├── style.css          # Estilos
│   └── dashboard.js       # Lógica frontend
├── node_modules/          # Dependências instaladas
├── README.md              # Visão geral
├── QUICK_START.md         # Começar rápido
├── SETUP_GUIDE.md         # Configurar IA
├── SOCIAL_MEDIA_SETUP.md  # Configurar redes
├── ARCHITECTURE.md        # Este arquivo
└── index.js               # Arquivo antigo (depreciado)
```

---

## Segurança

### O que é Público
- `public/*` - Frontend (CSS, JS, HTML)
- `README.md`, documentação - Info pública

### O que é Privado
- `.env` - Chaves de API
- `cookies.json` - Sessões
- `generated/*` - Conteúdo

### .gitignore
```
.env
cookies.json
generated/
node_modules/
```

---

## Performance

### Optimizações Implementadas
1. **Cache local** - Imagens/vídeos salvos localmente
2. **Fallbacks rápidos** - Múltiplas opções
3. **Async/Await** - Não bloqueia UI
4. **WebSocket** - Comunicação eficiente
5. **Batch updates** - Agualizar múltiplos dados

### Limites
- Imagens: Depende da API (0.5s - 30s)
- Vídeos: Depende do FFmpeg (5s - 30s)
- Total por postagem: ~1-2 minutos
- Dashboard: Atualizações < 100ms

---

## Próximas Melhorias

1. **Banco de dados** - Histórico de postagens
2. **Dashboard avançado** - Gráficos, analytics
3. **Automação real das redes** - Implementar posting
4. **Rate limiting inteligente** - Respeitar limites
5. **Multi-account** - Gerenciar múltiplas contas
6. **Mobile app** - App nativa
7. **ML** - Aprender melhores horários/conteúdo
