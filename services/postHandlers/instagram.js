const { waitForNavigationOrTimeout, clickButtonByText, fillAndValidateField } = require('../browserUtils');

async function postInstagram(page, imagePath, caption, agentStatus) {
  agentStatus.updateTask('Postando no Instagram...', 94);

  try {
    // Ir para página de criação
    await page.goto('https://www.instagram.com/create/', { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Tentar múltiplos métodos de upload
    let uploaded = false;

    // Método 1: input[type="file"] direto
    const fileInputSelectors = [
      'input[type="file"]',
      'input[accept*="image"]',
      'input[accept*="image"][type="file"]',
      'input[type="file"][accept]'
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
        // Continuar
      }
    }

    // Método 2: Procurar por elemento clicável para upload
    if (!uploaded) {
      try {
        const uploadElements = await page.$$(
          'button, div[role="button"], svg, img'
        );

        for (const elem of uploadElements) {
          const text = await page.evaluate(el => el.textContent || el.title || '', elem);
          if (text && (text.includes('upload') || text.includes('Upload') || text.includes('Selecionar'))) {
            await elem.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const input = await page.$('input[type="file"]');
            if (input) {
              await input.uploadFile(imagePath);
              uploaded = true;
              break;
            }
          }
        }
      } catch (e) {
        agentStatus.log(`Erro ao procurar elemento de upload: ${e.message}`);
      }
    }

    if (!uploaded) {
      throw new Error('Não foi possível fazer upload da imagem');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Clicar em Avançar/Next
    try {
      await page.evaluate(() => {
        const xpath = "//button[contains(text(), 'Avançar') or contains(text(), 'Next') or contains(text(), 'ক্রমাগত') or contains(text(), 'نيل هذا')]";
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue) {
          result.singleNodeValue.click();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      agentStatus.log('Avançar 1 clicado');
    } catch (e) {
      agentStatus.log(`Erro no Avançar 1: ${e.message}`);
    }

    try {
      await page.evaluate(() => {
        const xpath = "//button[contains(text(), 'Avançar') or contains(text(), 'Next') or contains(text(), 'ক্রমাগত') or contains(text(), 'نيل هذا')]";
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue) {
          result.singleNodeValue.click();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      agentStatus.log('Avançar 2 clicado');
    } catch (e) {
      agentStatus.log(`Erro no Avançar 2: ${e.message}`);
    }

    // Adicionar legenda com validação
    const captionSelectors = [
      'textarea[aria-label*="Legenda"]',
      'textarea[aria-label*="Caption"]',
      'textarea[placeholder*="Legenda"]',
      'textarea[placeholder*="Descreva seu post"]',
      'textarea[placeholder*="Add a caption"]',
      'textarea',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]'
    ];

    const captionFilled = await fillAndValidateField(page, captionSelectors, caption, agentStatus);
    
    if (!captionFilled) {
      agentStatus.log(`⚠️ Aviso: Legenda pode não ter sido preenchida corretamente`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Compartilhar/Share
    try {
      await page.evaluate(() => {
        const xpath = "//button[contains(text(), 'Compartilhar') or contains(text(), 'Share') or contains(text(), 'শেয়ার করুন') or contains(text(), 'مشاركة')]";
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue) {
          result.singleNodeValue.click();
        }
      });
      await waitForNavigationOrTimeout(page, { waitUntil: 'networkidle2', timeout: 60000 });
      agentStatus.log('✅ Post enviado no Instagram');
    } catch (e) {
      agentStatus.log(`Erro ao compartilhar: ${e.message}`);
    }
  } catch (error) {
    agentStatus.log(`❌ Falha ao postar no Instagram: ${error.message}`);
  }
}

module.exports = { postInstagram };