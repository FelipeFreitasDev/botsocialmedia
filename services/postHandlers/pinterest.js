const { waitForNavigationOrTimeout, clickButtonByText } = require('../browserUtils');

async function postPinterest(page, imagePath, caption, agentStatus) {
  agentStatus.updateTask('Postando no Pinterest...', 96);

  try {
    await page.goto('https://www.pinterest.com/pin-builder/', { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Método 1: input de arquivo
    let uploaded = false;
    const fileInputSelectors = [
      'input[type="file"]',
      'input[accept*="image"]',
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

    // Método 2: Procurar por botão de upload
    if (!uploaded) {
      try {
        const buttons = await page.$$('button, div[role="button"]');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && (text.includes('Upload') || text.includes('Selecionar') || text.includes('Escolher'))) {
            await btn.click();
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
        agentStatus.log(`Erro ao procurar upload: ${e.message}`);
      }
    }

    if (!uploaded) {
      throw new Error('Não foi possível fazer upload da imagem');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Preencher título
    const titleSelectors = ['input[name="title"]', 'input[placeholder*="Título"]', 'input[placeholder*="Title"]', 'input'];
    for (const selector of titleSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const placeholder = await page.evaluate(el => el.placeholder, element);
          if (!placeholder || placeholder.includes('Título') || placeholder.includes('Title')) {
            await element.focus();
            await page.keyboard.type('Versículo inspirador', { delay: 30 });
            break;
          }
        }
      } catch (e) {
        // Continuar
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Preencher descrição com múltiplas tentativas
    let descAdded = false;
    
    const descSelectors = [
      'textarea[name="description"]',
      'textarea[aria-label*="Descrição"]',
      'textarea[aria-label*="Description"]',
      'textarea[placeholder*="Descrição"]',
      'textarea[placeholder*="About"]',
      'textarea[placeholder*="Adicione"]',
      'textarea[placeholder*="Add"]',
      'textarea',
      'div[contenteditable="true"]'
    ];

    for (const selector of descSelectors) {
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
          agentStatus.log(`✅ Descrição adicionada: "${caption.substring(0, 50)}..."`);
          descAdded = true;
          break;
        }
      } catch (e) {
        agentStatus.log(`❌ Seletor ${selector} falhou`);
      }
    }

    // Fallback: usar evaluate
    if (!descAdded) {
      try {
        await page.evaluate((text) => {
          const elements = document.querySelectorAll('textarea, div[contenteditable]');
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
        
        agentStatus.log(`✅ Descrição adicionada via evaluate: "${caption.substring(0, 50)}..."`);
        descAdded = true;
      } catch (e) {
        agentStatus.log(`⚠️ Erro ao adicionar descrição: ${e.message}`);
      }
    }

    if (!descAdded) {
      agentStatus.log(`⚠️ Não conseguiu adicionar descrição, tentando publicar mesmo assim`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clicar em Publicar
    try {
      await page.evaluate(() => {
        const xpath = "//button[contains(text(), 'Salvar') or contains(text(), 'Publicar') or contains(text(), 'Create pin') or contains(text(), 'Criar pin') or contains(text(), 'Publish') or contains(text(), 'Save')]";
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue) {
          result.singleNodeValue.click();
        }
      });
      await waitForNavigationOrTimeout(page, { waitUntil: 'networkidle2', timeout: 60000 });
      agentStatus.log('✅ Post enviado no Pinterest');
    } catch (e) {
      agentStatus.log(`Erro ao publicar: ${e.message}`);
    }
  } catch (error) {
    agentStatus.log(`❌ Falha ao postar no Pinterest: ${error.message}`);
  }
}

module.exports = { postPinterest };