# 🤖 Agente de IA para Redes Sociais

Um agente de IA autônomo que gera imagens e vídeos bíblicos e os posta automaticamente em Facebook, Instagram, Pinterest e TikTok, com uma interface gráfica em tempo real.

## ✨ Funcionalidades

- 📊 **Dashboard em Tempo Real**: Monitore o estado do agente, tarefas em execução e logs de atividades
- 🎨 **Geração de Imagens com Fallbacks**: Múltiplas ferramentas de IA gratuitas (Hugging Face, Stability AI, OpenAI)
- 🎬 **Geração de Vídeos**: Cria vídeos de 15 segundos com as imagens geradas
- 📝 **Geração de Texto**: Usa Ollama (local) ou OpenAI para criar descrições poéticas
- 🕐 **Agendamento Autônomo**: Posta automaticamente às 3h, 6h, 9h, 12h, 15h, 18h, 21h e 0h
- 🔄 **Fallbacks Automáticos**: Se uma ferramenta falhar, tenta a próxima automaticamente
- 🔌 **WebSocket em Tempo Real**: Atualizações ao vivo do status do agente

## 🚀 Configuração Rápida

1. **Clonar/Configurar o Projeto**
   ```bash
   cd d:\SaaS
   npm install
   ```

2. **Configurar Variáveis de Ambiente**
   ```bash
   # Copie .env.example para .env
   cp .env.example .env
   
   # Adicione suas chaves (opcionais com fallbacks)
   # OPENAI_API_KEY=sk-...
   # HUGGINGFACE_API_KEY=hf_...
   ```

3. **Iniciar o Servidor**
   ```bash
   npm start
   ```

4. **Acessar o Dashboard**
   - Abra http://localhost:3000 no navegador

## 📊 Dashboard - O que Você Pode Ver

- **Estado do Agente**: Status atual (Conectado, Trabalhando, Pausado)
- **Tarefa Atual**: Qual etapa está em execução (gerando imagem, vídeo, etc)
- **Redes Sociais Conectadas**: Status de login em cada rede
- **Ferramentas de IA em Uso**: Qual ferramenta está sendo usada no momento
- **Log de Atividades**: Histórico de todas as ações
- **Próximas Postagens**: Horários agendados
- **Controles**: Pausar, retomar, testar postagem

## 🆓 Ferramentas de IA Gratuitas Integradas

### Geração de Imagens (em ordem de fallback):
1. **Hugging Face** - Modelos Stable Diffusion (Gratuito)
2. **Stability AI** - Free Tier (100 créditos/mês)
3. **OpenAI DALL-E** - Free Trial (créditos iniciais)

### Geração de Vídeos:
- **FFmpeg** - Converte imagens em vídeos (100% Local, Open Source)

### Geração de Texto:
1. **Ollama** - Modelos LLM locais (Gratuito, sem limite)
2. **OpenAI GPT** - Fallback (Free Trial)

## 🔐 Configurando as Ferramentas de IA

### Hugging Face (Recomendado - Gratuito)
1. Crie conta em https://huggingface.co
2. Vá para Settings > Access Tokens
3. Crie um token e adicione ao `.env`

### Ollama (Local - Sem Limites)
1. Instale https://ollama.ai
2. Baixe um modelo: `ollama pull llama2`
3. Confirme que está rodando em `localhost:11434`

### OpenAI (Free Trial)
1. Crie conta em https://openai.com
2. Use saídos do free trial
3. Adicione chave ao `.env`

## 🌐 Redes Sociais Conectadas

- **Facebook** - Automação com Puppeteer
- **Instagram** - Automação com Puppeteer
- **Pinterest** - Automação com Puppeteer
- **TikTok** - Automação com Puppeteer (requer login manual)

**⚠️ Nota**: A automação pode violar os termos de serviço. Use com responsabilidade e respeite as políticas de cada plataforma.

## 📁 Estrutura do Projeto

```
.
├── server.js              # Servidor Express + Socket.io
├── agentStatus.js         # Gerenciador de status do agente
├── aiManager.js           # Gerenciador de ferramentas de IA com fallbacks
├── contentGenerator.js    # Geração de conteúdo
├── socialMedia.js         # Automação das redes sociais
├── public/
│   ├── index.html        # Interface gráfica
│   ├── style.css         # Estilos do dashboard
│   └── dashboard.js      # Lógica do dashboard
├── .env.example          # Exemplo de variáveis de ambiente
└── README.md             # Este arquivo
```

## 🛠️ Desenvolvimento

### Adicionar Mais Versículos
Edite `contentGenerator.js` e adicione versículos no array `verses`.

### Adicionar Novas Ferramentas de IA
Implemente novos métodos em `aiManager.js` seguindo o padrão de fallback.

### Customizar o Dashboard
Edite `public/index.html` e `public/style.css`.

## ⚙️ Variáveis de Ambiente

```
OPENAI_API_KEY=sk-...              # OpenAI (opcional)
HUGGINGFACE_API_KEY=hf_...         # Hugging Face (opcional)
STABILITY_API_KEY=sk-...           # Stability AI (opcional)
REPLICATE_API_KEY=...              # Replicate (opcional)
PORT=3000                          # Porta do servidor
```

## 🆘 Troubleshooting

**"Ferramentas de IA não funcionam"**
- Verifique se as chaves de API estão corretas
- Tente com Ollama (local) primeiro
- Veja o log de atividades no dashboard

**"Imagens não estão sendo criadas"**
- Confirm que a pasta `generated/` existe
- Verifique permissões de arquivo
- Veja o console para erros

**"Redes sociais não conectam"**
- Execute manualmente `runAutomation()` com `headless: false`
- Faça login manualmente e salve os cookies
- Verifique que as contas suportam automação

## 📝 Licença

MIT - Use livremente!