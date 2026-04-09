const { waitForNavigationOrTimeout, clickButtonByText, fillAndValidateField } = require('../browserUtils');

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

    // Preencher legenda com validação
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

    const captionFilled = await fillAndValidateField(page, captionSelectors, caption, agentStatus);
    
    if (!captionFilled) {
      agentStatus.log(`⚠️ Aviso: Legenda pode não ter sido preenchida corretamente`);
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