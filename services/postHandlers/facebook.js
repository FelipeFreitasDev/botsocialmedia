const { waitForNavigationOrTimeout } = require('../browserUtils');

async function postFacebook(page, imagePath, caption, agentStatus) {
  agentStatus.updateTask('Postando no Facebook...', 92);

  try {
    // Ir para a página de composição
    await page.goto('https://www.facebook.com/share/?app_id=123', { waitUntil: 'networkidle2', timeout: 90000 }).catch(() => null);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Tentar encontrar input de arquivo
    let uploaded = false;

    // Método 1: Procurar input[type="file"] com múltiplos seletores
    const fileInputSelectors = [
      'input[type="file"]',
      'input[accept*="image"]',
      'input[accept*="image"][type="file"]'
    ];

    for (const selector of fileInputSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          await input.uploadFile(imagePath);
          agentStatus.log('Arquivo enviado via input');
          uploaded = true;
          break;
        }
      } catch (e) {
        agentStatus.log(`Seletor ${selector} não funcionou`);
      }
    }

    // Método 2: Se não encontrou input, procurar por botão e usar drag-drop
    if (!uploaded) {
      try {
        // Procurar por botão de upload
        const buttons = await page.$$('button, div[role="button"]');
        let foundUploadButton = false;

        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && (text.includes('Foto') || text.includes('Imagem') || text.includes('Upload') || text.includes('Adicionar'))) {
            await btn.click();
            foundUploadButton = true;
            break;
          }
        }

        if (foundUploadButton) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Tentar novamente encontrar input
          const input = await page.$('input[type="file"]');
          if (input) {
            await input.uploadFile(imagePath);
            uploaded = true;
            agentStatus.log('Arquivo enviado após clicar em botão');
          }
        }
      } catch (e) {
        agentStatus.log(`Erro ao procurar botão de upload: ${e.message}`);
      }
    }

    if (!uploaded) {
      throw new Error('Não foi possível encontrar campo de upload de arquivo');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Preencher caption
    const textAreaSelectors = ['textarea[name="xc_message"]', 'textarea', 'div[contenteditable="true"]'];
    for (const selector of textAreaSelectors) {
      const element = await page.$(selector);
      if (element) {
        await element.focus();
        await page.keyboard.type(caption, { delay: 30 });
        agentStatus.log('Legenda adicionada');
        break;
      }
    }

    // Clicar em Publicar
    try {
      await page.evaluate(() => {
        const xpath = "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'publicar')] | //button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'postar')] | //input[@type='submit']";
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue) {
          result.singleNodeValue.click();
        }
      });
      await waitForNavigationOrTimeout(page, { waitUntil: 'networkidle2', timeout: 60000 });
      agentStatus.log('✅ Post enviado no Facebook');
    } catch (e) {
      agentStatus.log(`❌ Falha ao postar no Facebook: ${e.message}`);
    }
  } catch (error) {
    agentStatus.log(`❌ Falha ao postar no Facebook: ${error.message}`);
  }
}

module.exports = { postFacebook };