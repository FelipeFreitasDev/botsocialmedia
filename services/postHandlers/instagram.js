const { waitForNavigationOrTimeout, clickButtonByText, uploadFileInput } = require('../browserUtils');

async function postInstagram(page, imagePath, caption, agentStatus) {
  agentStatus.updateTask('Postando no Instagram...', 94);

  try {
    await page.goto('https://www.instagram.com/create/details/', { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForTimeout(3000);

    await uploadFileInput(page, 'input[type="file"]', imagePath);
    await page.waitForTimeout(4000);

    await clickButtonByText(page, ['Avançar', 'Next'], 30000);
    await page.waitForTimeout(2000);
    await clickButtonByText(page, ['Avançar', 'Next'], 30000);
    await page.waitForTimeout(2000);

    const captionField = await page.$('textarea[aria-label*="Legenda"]') || await page.$('textarea');
    if (captionField) {
      await captionField.focus();
      await page.keyboard.type(caption, { delay: 40 });
    }

    await clickButtonByText(page, ['Compartilhar', 'Share'], 30000);
    await waitForNavigationOrTimeout(page, { waitUntil: 'networkidle2', timeout: 60000 });
    agentStatus.log('✅ Post enviado no Instagram');
  } catch (error) {
    agentStatus.log(`❌ Falha ao postar no Instagram: ${error.message}`);
  }
}

module.exports = { postInstagram };