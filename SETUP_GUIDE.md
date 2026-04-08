# 🚀 Guia de Configuração - Ferramentas de IA Gratuitas

Este guia explica como configurar todas as ferramentas de IA gratuitas para o funcionamento optimal do agente.

## 📌 Resumo Executivo

O sistema foi projetado com **fallbacks automáticos**. Você não precisa configurar todas as ferramentas - use pelo menos uma para começar:

**Opção mais fácil**: 
- ✅ Ollama (local, sem limite, sem pagar)

**Opção Online (gratuita)**:  
- ✅ Hugging Face (modelos gratuitos)

**Se tiver budget**:
- ✅ OpenAI (free trial)

---

## 1️⃣ OLLAMA (Recomendado - 100% Gratuito, Local, Sem Limite)

### O que é?
Executa modelos de IA localmente no seu computador. Sem internet obrigatória, sem limite de tokens, sem custos.

### Passos de Instalação

1. **Baixe Ollama**
   - Vá para: https://ollama.ai
   - Clique em "Download"
   - Escolha seu SO (Windows, Mac, Linux)

2. **Instale**
   - Executar o instalador
   - Deixar as configurações padrão

3. **Abra o Terminal e Execute:**
   ```bash
   # Baixar um modelo (llama2 é bom para começar)
   ollama pull llama2
   
   # Ou para modelos menores e mais rápidos:
   ollama pull neural-chat   # Mais rápido
   ollama pull mistral       # Bom balanço
   ```

4. **Verificar se está rodando**
   ```bash
   # Ollama roda automaticamente em background
   # Testar: abra http://localhost:11434/api/tags
   # Deve devolver uma lista de modelos
   ```

5. **No arquivo `.env`, nada a adicionar** (funciona por padrão em `localhost:11434`)

### ✅ Vantagens
- Executado localmente (privacidade máxima)
- Sem limite de tokens
- Sem custos
- Funciona offline

### ❌ Desvantagens  
- Requer mais poder de processamento
- Um pouco mais lento que cloud

---

## 2️⃣ HUGGING FACE (Gratuito - Online, Recomendado para Imagens)

### O que é?
Plataforma com modelos de IA gratuitos, incluindo Stable Diffusion para gerar imagens.

### Passos de Configuração

1. **Criar Conta**
   - Vá para: https://huggingface.co
   - Clique em "Sign Up"
   - Complete o registro

2. **Gerar Token**
   - Vá para: https://huggingface.co/settings/tokens
   - Clique em "New token"
   - Escolha "Read" como tipo
   - Copie o token gerado

3. **Adicionar ao `.env`**
   ```
   HUGGINGFACE_API_KEY=hf_seuTokenAqui
   ```

4. **Testar**
   ```bash
   # No Node.js REPL ou em um arquivo test.js
   const { HfInference } = require("@huggingface/inference");
   const hf = new HfInference("hf_seuTokenAqui");
   
   const result = await hf.textToImage({
     inputs: "biblico landscape angel",
   });
   console.log(result);
   ```

### ✅ Vantagens
- Modelos de alta qualidade (Stable Diffusion)
- Gratuito
- Rápido
- Fácil de usar

### ❌ Desvantagens
- Limite de requisições (mas generoso)
- Requer internet

### Modelos Populares no Hugging Face
- `stabilityai/stable-diffusion-2` - Excelente qualidade
- `runwayml/stable-diffusion-v1-5` - Muito bom
- `prompthero/openjourney` - Estilo artístico

---

## 3️⃣ STABILITY AI (Free Tier - Até 100 Imagens/Mês)

### O que é?
Front-end oficial do Stable Diffusion com free tier.

### Passos de Configuração

1. **Criar Conta**
   - Vá para: https://platform.stability.ai
   - Clique em "Sign Up"
   - Verifique seu email

2. **Pegar Chave de API**
   - No dashboard, vá para "API Keys"
   - Copie sua chave

3. **Adicionar ao `.env`**
   ```
   STABILITY_API_KEY=sk_seuTokenAqui
   ```

4. **Free Credits**
   - Você ganha 100 créditos/mês (1 imagem = ~1 crédito)
   - Suficiente para ~3 imagens/dia

### ✅ Vantagens
- Qualidade premium (versão oficial)
- Mais rápido que alternativas
- Interface simples

### ❌ Desvantagens
- Limite de 100 imagens/mês
- Se exceder, precisa pagar

---

## 4️⃣ OPENAI (Free Trial + Pagamento)

### O que é?
GPT-3.5 e DALL-E da OpenAI. Algumas funcionalidades podem usar free trial.

### Passos de Configuração

1. **Criar Conta**
   - Vá para: https://platform.openai.com
   - Clique em "Sign Up"
   - Verifique seu email

2. **Pegar Chave de API**
   - Vá para: https://platform.openai.com/api-keys
   - Clique em "Create new secret key"
   - Copie a chave

3. **Adicionar ao `.env`**
   ```
   OPENAI_API_KEY=sk-...
   ```

4. **Verificar Free Credits**
   - Entrar em: https://platform.openai.com/account/billing/overview
   - Você deve ter $5 de créditos de teste (expiram em 3 meses)

### ✅ Vantagens
- Qualidade premium
- Acesso a DALL-E 3 (melhor geração de imagens)
- GPT-4 disponível

### ❌ Desvantagens
- Free trial expirado = precisa pagar
- Mais caro que alternativas
- Para nosso caso, é o fallback

---

## 5️⃣ REPLICATE (Gratuito com Limite)

### O que é?
API que roda modelos gratuitos de IA para vídeo, imagem, etc.

### Passos de Configuração

1. **Criar Conta**
   - Vá para: https://replicate.com
   - Clique em "Sign in"
   - GitHub login é fácil

2. **Pegar Chave de API**
   - Vá para: https://replicate.com/account
   - Copie a "API Token"

3. **Adicionar ao `.env`**
   ```
   REPLICATE_API_KEY=seuTokenAqui
   ```

4. **Usar**
   - Temos FFmpeg local (mais fácil que Replicate para vídeo)

### ✅ Vantagens
- Gratuito
- Modelos diversos

### ❌ Desvantagens  
- Fila de requisições (pode ser lento)
- Para nosso caso, FFmpeg local é melhor

---

## 📊 Recomendação de Configuração

### 🏆 Configuração Ideal (Testado)
```
# .env recomendado
HUGGINGFACE_API_KEY=hf_...      # Imagens (gratuito)
OPENAI_API_KEY=sk-...            # Fallback (free trial)
PORT=3000
```

**System Local:**
- Instale Ollama para geração de texto (gratuito, local)

### 💰 Querendo Máxima Qualidade
```
STABILITY_API_KEY=sk-...         # Imagens (melhor qualidade)
OPENAI_API_KEY=sk-...            # Fallback DALL-E
HUGGINGFACE_API_KEY=hf_...       # Fallback Hugging Face
```

### 🚀 Modo Gratuito Total (Sem Pagar)
```
HUGGINGFACE_API_KEY=hf_...       # Imagens (gratuito)
# Nada mais é obrigatório
# Ollama instalado localmente para texto
```

---

## 🔧 Testar a Configuração

### Verificar se Tudo Está Funcionando

1. **Abra http://localhost:3000 no navegador**
   - Você deve ver o Dashboard

2. **Clique em "Testar Postagem"**
   - O sistema tentará:
     - Gerar uma imagem
     - Gerar um vídeo
     - Gerar uma descrição
     - Postar nas redes (dummy para agora)

3. **Verifique o Log**
   - Você verá qual ferramenta foi usada
   - Se falhar, tentará a próxima

### Exemplo de Output Esperado
```
[22:50:00] Versículo selecionado: João 3:16...
[22:50:01] Imagem gerada com Hugging Face
[22:50:05] Vídeo gerado com FFmpeg
[22:50:06] Texto gerado com Ollama (Local)
[22:50:07] Iniciando automação das redes sociais
[22:50:08] Postagem concluída!
```

---

## 🆘 Troubleshooting

### "Erro: HUGGINGFACE_API_KEY não configurada"
- [ ] Você adicionou a chave ao `.env`?
- [ ] Reiniciou o servidor (`npm start`)?
- [ ] Pode usar Ollama como fallback (não precisa de API)

### "Erro: Ollama não disponível"
- [ ] Instale Ollama: https://ollama.ai
- [ ] Abra terminal e execute: `ollama pull llama2`
- [ ] Aguarde o modelo ser baixado (~4GB)
- [ ] Verificar: http://localhost:11434/api/tags

### "Imagem não é gerada de forma consistente"
- [ ] Verifique permissões de pasta `generated/`
- [ ] Tente diferentes prompts
- [ ] Sistema tenta 3 ferramentas antes de falhar

### "API Rate Limited"
- [ ] Aguarde alguns minutos
- [ ] Use Ollama (sem limite, local)
- [ ] Sistema tem espera automática entre requisições

---

## 📱 Monitorar no Dashboard

O Dashboard mostra em tempo real:
- ✅ **Qual ferramenta está sendo usada**
- ✅ **Status de cada provider**
- ✅ **Erros e fallbacks**
- ✅ **Log completo de atividades**
- ✅ **Status de login nas redes sociais**

---

## 🎯 Próximos Passos

1. **Escolha pelo menos uma ferramenta** de imagem
2. **Configure o `.env`**
3. **Clique em "Testar Postagem"** no Dashboard
4. **Veja os logs** para validar
5. **Configure manualmente** as redes sociais (login)
6. **Agente começará a postar** nos horários agendados

Boa sorte! 🚀
