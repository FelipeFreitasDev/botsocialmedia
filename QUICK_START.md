# ⚡ Quick Start - Começar em 5 Minutos

## Passo 1: Iniciar o Servidor (30 segundos)

```bash
cd d:\SaaS
npm start
```

Você deve ver:
```
🤖 Servidor iniciado em http://localhost:3000
```

## Passo 2: Abrir o Dashboard (30 segundos)

1. Abra seu navegador (Chrome, Firefox, Edge)
2. Visite: **http://localhost:3000**
3. Você verá a interface gráfica com o agente

## Passo 3: Configurar Ferramentas de IA (2-3 minutos)

### Opção A: Ollama (Recomendado - Gratuito, Local)

```bash
# 1. Instale Ollama de https://ollama.ai
# 2. Abra terminal e execute:
ollama pull llama2

# 3. Pronto! Ollama roda em localhost:11434
```

### Opção B: Hugging Face (Gratuito, Online)

```bash
# 1. Vá para https://huggingface.co/settings/tokens
# 2. Crie novo token
# 3. Edite .env e adicione:
HUGGINGFACE_API_KEY=hf_seuToken
```

## Passo 4: Testar (1 minuto)

1. No Dashboard, clique em **"Testar Postagem"**
2. Veja o log de atividades
3. Deve gerar imagem, vídeo e descrição

## Passo 5: Configurar Redes Sociais (1-2 minutos)

1. Clique em "Testar Postagem" novamente
2. Um **navegador vai abrir**
3. Faça login em cada rede:
   - Facebook
   - Instagram
   - Pinterest
   - TikTok

4. **Saia do navegador** (o agente salva tudo)

## 🎉 Pronto!

Seu agente começará a postar automaticamente nos horários:
- 3:00 AM, 6:00 AM, 9:00 AM, 12:00 PM
- 3:00 PM, 6:00 PM, 9:00 PM, 12:00 AM

---

## 📊 Ver Status

**Dashboard em tempo real:** http://localhost:3000

Mostra:
- ✅ Qual rede está logada
- ✅ Qual ferramenta de IA está sendo usada  
- ✅ Próximas postagens agendadas
- ✅ Log de todas as atividades
- ✅ Botões para pausar/retomar

---

## 🆘 Se Não Funcionar

1. **Agente não inicia?**
   ```bash
   node -c server.js   # Verificar sintaxe
   npm start           # Tentar novamente
   ```

2. **Dashboard não carrega?**
   - Verifique se servidor está rodando
   - Tente: http://localhost:3000/index.html
   - Veja console do navegador (F12) para erros

3. **Não consegue gerar imagens?**
   - Por padrão, sem API configrada não gera
   - Configure Ollama, Hugging Face ou OpenAI
   - Veja `SETUP_GUIDE.md` para detalhes

4. **Rede social não conecta?**
   - Fazer login manualmente no navegador que abrir
   - Verificar se 2FA está ativado
   - Ver `SOCIAL_MEDIA_SETUP.md`

---

## 📚 Documentação Completa

- `README.md` - Visão geral
- `SETUP_GUIDE.md` - Configurar ferramentas de IA
- `SOCIAL_MEDIA_SETUP.md` - Configurar redes sociais
- `QUICK_START.md` - Este arquivo

---

## 💡 Dicas

- Ollama é a melhor opção para começar (gratuito, local, sem limite)
- Hugging Face é ótimo para imagens de alta qualidade
- TikTok é o mais difícil de automatizar (strong bot detection)
- Pinterest é o mais fácil (menos bot detection)
- Use contas de teste, não suas contas principais!

---

Boa sorte! 🚀 Qualquer dúvida, veja a documentação completa.
