const { waitForNavigationOrTimeout, clickButtonByText } = require('../browserUtils');

async function postTikTok(page, videoPath, caption, agentStatus) {
  agentStatus.updateTask('Postando no TikTok...', 98);

  try {
    await page.goto('https://www.tiktok.com/upload', { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Método 1: input de arquivo
    let uploaded = false;
    const fileInputSelectors = [
      'input[type="file"]',
      'input[accept*="video"]',
      'input[type="file"][accept]'
    ];

    for (const selector of fileInputSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          await input.uploadFile(videoPath);
          agentStatus.log('Vídeo enviado via input');
          uploaded = true;
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    // Método 2: Procurar por botão de upload
    if (!uploaded) {
      try {
        const buttons = await page.$$('button, div[role="button"], div[class*="upload"]');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent || el.innerText || '', btn);
          if (text && (text.includes('Upload') || text.includes('Selecionar') || text.includes('enviar'))) {
            await btn.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const input = await page.$('input[type="file"]');
            if (input) {
              await input.uploadFile(videoPath);
              uploaded = true;
              break;
            }
          }
        }
      } catch (e) {
        agentStatus.log(`Erro ao procurar upload: ${e.message}`);
      }
    }

    if (!uploaded) {
      throw new Error('Não foi possível fazer upload do vídeo');
    }

    await new Promise(resolve => setTimeout(resolve, 4000));

    // Preencher legenda com múltiplas tentativas
    let captionAdded = false;
    
    const captionSelectors = [
      'textarea[aria-label*="legenda"]',
      'textarea[aria-label*="caption"]',
      'textarea[aria-label*="descrição"]',
      'textarea[placeholder*="legenda"]',
      'textarea[placeholder*="caption"]',
      'textarea[placeholder*="Legenda"]',
      'textarea[placeholder*="Caption"]',
      'textarea[placeholder*="descrever"]',
      'textarea[placeholder*="describe"]',
      'textarea'
    ];

    for (const selector of captionSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click({ delay: 100 });
          await element.focus();
          
          // Limpar
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Delete');
          
          // Digitar
          await page.keyboard.type(caption, { delay: 10 });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          agentStatus.log(`✅ Legenda adicionada: "${caption.substring(0, 50)}..."`);
          captionAdded = true;
          break;
        }
      } catch (e) {
        agentStatus.log(`❌ Seletor ${selector} falhou`);
      }
    }

    // Fallback: usar evaluate
    if (!captionAdded) {
      try {
        await page.evaluate((text) => {
          const elements = document.querySelectorAll('textarea, div[contenteditable], input');
          for (let elem of elements) {
            if (elem.offsetHeight > 0) {
              if (elem.tagName === 'TEXTAREA' || elem.contentEditable === 'true') {
                elem.focus();
                elem.textContent = text;
                elem.value = text;
                elem.dispatchEvent(new Event('input', { bubbles: true }));
                elem.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          }
          return false;
        }, caption);
        
        agentStatus.log(`✅ Legenda adicionada via evaluate: "${caption.substring(0, 50)}..."`);
        captionAdded = true;
      } catch (e) {
        agentStatus.log(`⚠️ Erro ao adicionar legenda: ${e.message}`);
      }
    }

    if (!captionAdded) {
      agentStatus.log(`⚠️ Não conseguiu adicionar legenda, tentando publicar mesmo assim`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clicar em Publicar
    try {
      await page.evaluate(() => {
        const xpath = "//button[contains(text(), 'Publicar') or contains(text(), 'Post') or contains(text(), 'Upload') or contains(text(), 'Enviar') or contains(text(), 'Postar')]";
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue) {
          result.singleNodeValue.click();
        }
      });
      await waitForNavigationOrTimeout(page, { waitUntil: 'networkidle2', timeout: 60000 });
      agentStatus.log('✅ Post enviado no TikTok');
    } catch (e) {
      agentStatus.log(`Erro ao publicar: ${e.message}`);
    }
  } catch (error) {
    agentStatus.log(`❌ Falha ao postar no TikTok: ${error.message}`);
  }
}

module.exports = { postTikTok };