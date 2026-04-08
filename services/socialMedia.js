const { launchBrowser, saveCookies, loadCookies, clearCookies } = require('./browserUtils');
const { isInstagramLoggedIn, isFacebookLoggedIn, isPinterestLoggedIn, isTikTokLoggedIn } = require('./loginCheckers');
const { postFacebook } = require('./postHandlers/facebook');
const { postInstagram } = require('./postHandlers/instagram');
const { postPinterest } = require('./postHandlers/pinterest');
const { postTikTok } = require('./postHandlers/tiktok');

const NETWORKS = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com',
    checkLogin: isFacebookLoggedIn,
    sessionId: 'facebook',
    postHandler: postFacebook
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com',
    checkLogin: isInstagramLoggedIn,
    sessionId: 'instagram',
    postHandler: postInstagram
  },
  {
    name: 'Pinterest',
    url: 'https://www.pinterest.com',
    checkLogin: isPinterestLoggedIn,
    sessionId: 'pinterest',
    postHandler: postPinterest
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/upload?lang=pt-BR',
    checkLogin: isTikTokLoggedIn,
    sessionId: 'tiktok',
    postHandler: postTikTok
  }
];

async function runAutomation(imagePath, videoPath, caption, agentStatus) {
  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    for (const network of NETWORKS) {
      try {
        agentStatus.updateTask(`Verificando ${network.name}...`, 80);
        agentStatus.log(`📱 Tentando acessar ${network.name}`);

        await clearCookies(page);
        await loadCookies(page, network.sessionId);

        await page.goto(network.url, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        let isLoggedIn = await network.checkLogin(page);
        if (!isLoggedIn) {
          agentStatus.log(`⚠️ Não logado no ${network.name}. Aguarde login manual no navegador.`);
          agentStatus.setLoginStatus(network.name, false);

          await new Promise(resolve => setTimeout(resolve, 120000));
          isLoggedIn = await network.checkLogin(page);
          if (!isLoggedIn) {
            agentStatus.log(`❌ Login não realizado no ${network.name}`);
            continue;
          }
        }

        agentStatus.setLoginStatus(network.name, true);
        agentStatus.log(`✅ Logado no ${network.name}`);
        await saveCookies(page, network.sessionId);
        agentStatus.log(`💾 Cookies salvos para ${network.name}`);

        const payload = network.name === 'TikTok' ? [videoPath, caption] : [imagePath, caption];
        await network.postHandler(page, ...payload, agentStatus);
      } catch (error) {
        if (error.message.includes('Timeout')) {
          agentStatus.log(`⏱️ Timeout ao acessar ${network.name}`);
        } else {
          agentStatus.log(`❌ Erro em ${network.name}: ${error.message}`);
        }
        agentStatus.setLoginStatus(network.name, false);
      }
    }
  } catch (error) {
    agentStatus.log(`❌ Erro na automação: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { runAutomation, NETWORKS };