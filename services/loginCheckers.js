async function isInstagramLoggedIn(page) {
  try {
    const token = await page.evaluate(() => {
      try {
        return localStorage.getItem('sessionid') || localStorage.getItem('ds_user_id');
      } catch {
        return null;
      }
    });

    if (token) return true;

    const userMenu = await page.evaluate(() => {
      return document.querySelector('[aria-label*="Profile"]') !== null ||
        document.querySelector('a[href="/"]') !== null ||
        document.querySelector('[role="menuitem"]') !== null;
    });

    if (userMenu) return true;

    const hasLogout = await page.evaluate(() => {
      const html = document.body.innerHTML;
      return html.includes('Log out') || html.includes('Sair') || html.includes('switch account');
    });

    return hasLogout;
  } catch (error) {
    console.error('Erro ao verificar login do Instagram:', error);
    return false;
  }
}

async function isFacebookLoggedIn(page) {
  try {
    return await page.evaluate(() => {
      return document.querySelector('[aria-label="Menu"]') !== null ||
        document.querySelector('[aria-label="Messenger"]') !== null ||
        document.querySelector('a[href*="/profile.php"]') !== null;
    });
  } catch (error) {
    console.error('Erro ao verificar login do Facebook:', error);
    return false;
  }
}

async function isPinterestLoggedIn(page) {
  try {
    return await page.evaluate(() => {
      return document.querySelector('[aria-label="Profile"]') !== null ||
        document.querySelector('[data-test-id="userProfileImage"]') !== null;
    });
  } catch (error) {
    console.error('Erro ao verificar login do Pinterest:', error);
    return false;
  }
}

async function isTikTokLoggedIn(page) {
  try {
    return await page.evaluate(() => {
      return document.querySelector('[aria-label="Upload"]') !== null ||
        document.querySelector('div[title*="Post"]') !== null ||
        document.querySelector('img[alt*="profile"]') !== null;
    });
  } catch (error) {
    console.error('Erro ao verificar login do TikTok:', error);
    return false;
  }
}

module.exports = {
  isInstagramLoggedIn,
  isFacebookLoggedIn,
  isPinterestLoggedIn,
  isTikTokLoggedIn
};