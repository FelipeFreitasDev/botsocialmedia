const { waitForNavigationOrTimeout, uploadFileInput } = require('../browserUtils');

async function postFacebook(page, imagePath, caption, agentStatus) {
  agentStatus.updateTask('Postando no Facebook...', 92);

  try {
    await page.goto('https://m.facebook.com/composer.php', { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForTimeout(2000);

    await uploadFileInput(page, 'input[type="file"]', imagePath);
    await page.waitForTimeout(4000);

    const textArea = await page.$('textarea[name="xc_message"]') || await page.$('textarea');
    if (textArea) {
      await textArea.focus();
      await page.keyboard.type(caption, { delay: 40 });
    }

    const [publishButton] = await page.$x("//button[contains(normalize-space(string(.)), 'Publicar')] | //button[contains(normalize-space(string(.)), 'Postar')] | //input[@type='submit' and (contains(@value, 'Publicar') or contains(@value, 'Postar'))]");
    if (!publishButton) {
      throw new Error('Botão Publicar não encontrado no Facebook');
    }

    await publishButton.click();
    await waitForNavigationOrTimeout(page, { waitUntil: 'networkidle2', timeout: 60000 });
    agentStatus.log('✅ Post enviado no Facebook');
  } catch (error) {
    agentStatus.log(`❌ Falha ao postar no Facebook: ${error.message}`);
  }
}

module.exports = { postFacebook };