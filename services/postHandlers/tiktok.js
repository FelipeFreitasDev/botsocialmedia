const { waitForNavigationOrTimeout, clickButtonByText, uploadFileInput } = require('../browserUtils');

async function postTikTok(page, videoPath, caption, agentStatus) {
  agentStatus.updateTask('Postando no TikTok...', 98);

  try {
    await page.goto('https://www.tiktok.com/upload?lang=pt-BR', { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForTimeout(4000);

    await uploadFileInput(page, 'input[type="file"]', videoPath);
    await page.waitForTimeout(5000);

    const descriptionInput = await page.$('textarea[placeholder*="legenda"]') || await page.$('textarea');
    if (descriptionInput) {
      await descriptionInput.focus();
      await page.keyboard.type(caption, { delay: 40 });
    }

    await clickButtonByText(page, ['Publicar', 'Post', 'Upload'], 30000);
    await waitForNavigationOrTimeout(page, { waitUntil: 'networkidle2', timeout: 60000 });
    agentStatus.log('✅ Post enviado no TikTok');
  } catch (error) {
    agentStatus.log(`❌ Falha ao postar no TikTok: ${error.message}`);
  }
}

module.exports = { postTikTok };