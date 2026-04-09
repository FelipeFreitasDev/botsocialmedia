const { waitForNavigationOrTimeout, clickButtonByText } = require('../browserUtils');

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

    // Adicionar legenda com múltiplas tentativas
    let captionAdded = false;
    
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

    for (const selector of captionSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click({ delay: 100 });
          await element.focus();
          
          // Limpar campo
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Delete');
          
          // Digitar legenda
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

    // Fallback: usar evaluate para adicionar legenda
    if (!captionAdded) {
      try {
        await page.evaluate((text) => {
          const elements = document.querySelectorAll('textarea, div[contenteditable], input[type="text"]');
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
      agentStatus.log(`⚠️ Não conseguiu adicionar legenda, tentando compartilhar mesmo assim`);
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