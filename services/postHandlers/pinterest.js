const { waitForNavigationOrTimeout, clickButtonByText, uploadFileInput } = require('../browserUtils');

async function postPinterest(page, imagePath, caption, agentStatus) {
  agentStatus.updateTask('Postando no Pinterest...', 96);

  try {
    await page.goto('https://www.pinterest.com/pin-builder/', { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForTimeout(3000);

    await uploadFileInput(page, 'input[type="file"]', imagePath);
    await page.waitForTimeout(4000);

    const titleInput = await page.$('input[name="title"]') || await page.$('input[placeholder*="Título"]') || await page.$('input[placeholder*="Title"]');
    if (titleInput) {
      await titleInput.focus();
      await page.keyboard.type('Versículo inspirador', { delay: 40 });
    }

    const descriptionField = await page.$('textarea[name="description"]') || await page.$('textarea[placeholder*="Descrição"]') || await page.$('textarea[placeholder*="About"]') || await page.$('textarea');
    if (descriptionField) {
      await descriptionField.focus();
      await page.keyboard.type(caption, { delay: 40 });
    }

    await clickButtonByText(page, ['Salvar', 'Publicar', 'Create pin', 'Criar pin', 'Publish'], 30000);
    await waitForNavigationOrTimeout(page, { waitUntil: 'networkidle2', timeout: 60000 });
    agentStatus.log('✅ Post enviado no Pinterest');
  } catch (error) {
    agentStatus.log(`❌ Falha ao postar no Pinterest: ${error.message}`);
  }
}

module.exports = { postPinterest };