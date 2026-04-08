# 🌐 Guia de Configuração das Redes Sociais

Este guia explica como fazer login nas redes sociais para que o agente possa postar automaticamente.

## 📌 Como Funciona

1. **Login Manual (Primeira Vez)**  
   O agente usa Puppeteer com `headless: false` para abrir um navegador real
   - Você vê a tela e pode interagir
   - Faz login manualmente
   - Cookies são salvos localmente

2. **Automação Futura**
   - Nas próximas vezes, o agente usa os cookies salvos
   - Não precisa fazer login novamente (até expiração)
   - Posta automaticamente nos horários agendados

## ⚠️ Aviso Importante

**Automação em redes sociais pode:**
- Violar os Termos de Serviço
- Resultar em suspensão de conta
- Ser detectada como bot

**Recomendações:**
- Use contas secundárias / de teste
- Varie o tempo entre postagens
- Não poste spam ou conteúdo duplicado
- Respeite os limites de rate-limiting de cada plataforma

---

## 1️⃣ FACEBOOK

### Preparação

1. **Crie uma conta de teste** (se não quer usar a principal)
2. **Entre em https://facebook.com**
3. **Tenha uma página/perfil pronto**

### Como Fazer Login Automático

1. **Execute o Agente**
   ```bash
   npm start
   ```

2. **Acesse http://localhost:3000**

3. **Clique em "Testar Postagem"**

4. **Um navegador será aberto** (você verá a tela)

5. **Faça login normalmente** (email e senha)

6. **Permita o acesso** se pedir (pode precisar 2FA)

7. **Saia do navegador** (agente fecha automaticamente)

8. **Cookies são salvos** em `cookies.json`

### Status no Dashboard
- ✅ Se aparecer **verde** = Logado
- ❌ Se aparecer **vermelho** = Não logado (refaça o passo 1-7)

### Implementação Real (Próximo Passo)

A postagem real requer:
```javascript
// 1. Clicar em "Criar post"
await page.click('[aria-label="Criar post"]');

// 2. Adicionar imagem
await page.uploadFile('input[type="file"]', imagePath);

// 3. Adicionar texto
await page.type('[contenteditable="true"]', verse);

// 4. Postar
await page.click('button[name="xhpc_publish"]');
```

---

## 2️⃣ INSTAGRAM

### Preparação

1. **Crie uma conta de teste**
2. **Instale a app no navegador** (usa versão web)
3. **Entre em https://instagram.com**

### Como Fazer Login Automático

Mesmo processo do Facebook:

1. **Clique em "Testar Postagem"**
2. **Navegador abre automaticamente**
3. **Faça login** (username + password)
4. **Se pedir 2FA, escaneie com seu telefone**
5. **Saia** (agente salva cookies)

### Desafios com Instagram

- **2FA é comum** - precisa de seu telefone
- **Bot detection é forte** - pode não permitir automação
- **Interface Web é limitada** - pode precisar de Selenium/Puppeteer mais avançado

### Status no Dashboard
- Aparecerá um ● verde se logado
- Se falhar, refaça login manualmente

---

## 3️⃣ PINTEREST  

### Preparação

1. **Crie uma conta de teste**
2. **Entre em https://pinterest.com**
3. **Crie um board para os pinos**

### Como Fazer Login Automático

1. **Clique em "Testar Postagem"**
2. **Navegador abre com Pinterest**
3. **Faça login** (email + senha)
4. **Saia** (cookies salvos)

### Vantagens do Pinterest

✅ Permite automação mais facilmente
✅ Menos bot detection que Instagram  
✅ Descobre conteúdo (tráfego para links)

### Pino = Post no Pinterest
- Imagem + descrição
- Pode linkar para website
- Pode usar para trailer de conteúdo

---

## 4️⃣ TIKTOK

### Preparação

1. **Crie uma conta de teste**
2. **Verifique sua conta** (pode pedir número de telefone)
3. **Entre em https://tiktok.com**

### Como Fazer Login Automático

1. **Clique em "Testar Postagem"**
2. **Navegador abre com TikTok**
3. **Faça login** (pode pedir QR code)
4. **Autorize o acesso**
5. **Saia** (cookies salvos)

### Desafios com TikTok

⚠️ **TikTok é mais restritivo:**
- Bot detection muito forte
- Pode pedir verificação extra
- Web app é limitada (app mobile é preferida)
- Upload pode precisar de app mobile

### Alternativa
- Use a **app mobile automática** (mais difícil de configurar)
- Ou **poste manualmente** com download dos arquivos

---

## 🔐 Segurança dos Cookies

### Onde os Cookies são Salvos?
```
d:\SaaS\cookies.json
```

### O que Contém?
- Informações de sessão
- Tokens de autenticação
- Preferências de user

### Segurança
- ⚠️ **Não compartilhe este arquivo**
- ⚠️ **Não commite no Git** (adicionar a `.gitignore`)
- ✅ Está protegido por login da sua conta

### Adicionar ao .gitignore
```bash
# .gitignore
cookies.json
.env
generated/
```

---

## 📊 Fluxo Completo de Login

```
1. Você clica "Testar Postagem" no Dashboard
                    ↓
2. Agente abre navegador com headless=false
                    ↓
3. Você faz login manualmente em cada rede
                    ↓
4. Agente salva cookies em cookies.json
                    ↓
5. Próximas postagens usam cookies (sem refazer login)
                    ↓
6. Se cookies expiram (dias/meses), refaça login
```

---

## 🕐 Schedule de Postagens

O agente posta **automaticamente** em:
- 3:00 AM
- 6:00 AM  
- 9:00 AM
- 12:00 PM (Meio-dia)
- 3:00 PM
- 6:00 PM
- 9:00 PM
- 12:00 AM (Meia-noite)

**Total: 8 postagens/dia**
**Cada uma em 4 redes = 32 postagens/dia**

⚠️ **Isso pode triggar bot detection!**

**Recomendação:** Reduzir frequência ou usar contas diferentes

---

## 🛠️ Customizar Redes Sociais

### Adicionar Nova Rede

1. **Edite `server.js`**
   ```javascript
   const networks = [
     { name: 'Facebook', url: '...', fn: postToFacebook },
     { name: 'TuaRedeSocial', url: '...', fn: postToTuaRede }
   ];
   ```

2. **Implemente em `socialMedia.js`**
   ```javascript
   async function postToTuaRede(page, imageUrl, verse, agentStatus) {
     // Lógica de postagem
   }
   ```

3. **Adicione ao Dashboard**
   ```html
   <!-- public/index.html -->
   <div class="network-item">
     <span class="network-icon">🆕</span>
     <span class="network-name">Sua Rede</span>
     <span id="tua-rede-status" class="status-dot offline">●</span>
   </div>
   ```

---

## 🆘 Troubleshooting

### "Navegador não abre"
- [ ] Puppeteer pode estar faltando dependências
- [ ] Execute: `npm install puppeteer`
- [ ] Em Linux, pode precisar: `sudo apt-get install chromium`

### "Login não é salvo"
- [ ] Verifique se `cookies.json` foi criado
- [ ] Se não, cookies podem não estar sendo salvos
- [ ] Veja o console para erros

### "Agente não está postando"
- [ ] Verificar se está na hora agendada
- [ ] Ver o Dashboard - está "idle" ou "working"?
- [ ] Checar o log de atividades para erros

### "Bot detection / Suspensão"
- [ ] Reduza a frequência de postagens
- [ ] Use accounts diferentes
- [ ] Aguarde 24-48h antes de tentar novamente
- [ ] Verifique Termos de Serviço da plataforma

---

## 📱 Próximas Funcionalidades (Futuro)

- [ ] Upload real no Instagram (pode exigir app mobile)
- [ ] QR Code scanning automático para TikTok
- [ ] Detecção de bot e mudança de padrão
- [ ] Agendamento mais inteligente (respeitar padrões humanos)
- [ ] Dashboard para gerenciar redes conectadas

---

## ✅ Checklist de Configuração

- [ ] Servidore rodando: `npm start`
- [ ] Dashboard acessível: http://localhost:3000
- [ ] Ferramenta de IA configurada (HF / Stability / OpenAI)
- [ ] Ollama instalado (opcional, para texto)
- [ ] Login feito no Facebook
- [ ] Login feito no Instagram
- [ ] Login feito no Pinterest  
- [ ] Login feito no TikTok
- [ ] Cookies.json foi criado
- [ ] "Testar Postagem" funcionou
- [ ] Horários agendados aparecem no Dashboard
- [ ] Agente esperando próximo horário

Pronto! 🎉 Seu agente está configurado e pronto para postar autonomamente!
