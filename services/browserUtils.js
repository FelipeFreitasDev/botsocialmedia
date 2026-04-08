const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const COOKIE_PATH = path.join(__dirname, '..', 'cookies.json');

function findChromeExecutable() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];

  return possiblePaths.find((chromePath) => chromePath && fs.existsSync(chromePath)) || null;
}

async function launchBrowser() {
  const chromeExecutable = findChromeExecutable();
  const launchOptions = {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--start-maximized'
    ]
  };

  if (chromeExecutable) {
    launchOptions.executablePath = chromeExecutable;
  }

  return puppeteer.launch(launchOptions);
}

async function saveCookies(page, sessionId = 'default') {
  try {
    const cookies = await page.cookies();
    const cookiesData = {
      [sessionId]: {
        cookies,
        timestamp: new Date().toISOString()
      }
    };

    let existing = {};
    if (fs.existsSync(COOKIE_PATH)) {
      existing = JSON.parse(fs.readFileSync(COOKIE_PATH, 'utf8'));
    }

    fs.writeFileSync(COOKIE_PATH, JSON.stringify({ ...existing, ...cookiesData }, null, 2));
  } catch (error) {
    console.error('Erro ao salvar cookies:', error);
  }
}

async function loadCookies(page, sessionId = 'default') {
  try {
    if (!fs.existsSync(COOKIE_PATH)) {
      return;
    }

    const cookiesData = JSON.parse(fs.readFileSync(COOKIE_PATH, 'utf8'));
    if (cookiesData[sessionId] && cookiesData[sessionId].cookies) {
      await page.setCookie(...cookiesData[sessionId].cookies);
    }
  } catch (error) {
    console.error('Erro ao carregar cookies:', error);
  }
}

async function clearCookies(page) {
  const cookies = await page.cookies();
  if (cookies.length) {
    await page.deleteCookie(...cookies);
  }
}

async function waitForNavigationOrTimeout(page, options = {}) {
  const timeout = options.timeout || 30000;
  return Promise.race([
    page.waitForNavigation({ waitUntil: options.waitUntil || 'networkidle2', timeout }).catch(() => null),
    new Promise(resolve => setTimeout(resolve, timeout))
  ]);
}

async function clickButtonByText(page, labels, timeout = 20000) {
  const texts = Array.isArray(labels) ? labels : [labels];
  const conditions = texts
    .map((text) => `contains(normalize-space(string(.)), "${text}")`)
    .join(' or ');

  const xpath = `//button[${conditions}] | //a[${conditions}] | //div[${conditions}]`;
  await page.waitForXPath(xpath, { timeout });
  await page.evaluate((xpath) => {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    if (result.singleNodeValue) {
      result.singleNodeValue.focus();
      result.singleNodeValue.click();
    }
  }, xpath);
  // Since we can't return the element, return null or something
  return null;
}

async function uploadFileInput(page, selector, filePath) {
  await page.waitForSelector(selector, { visible: true, timeout: 20000 });
  const input = await page.$(selector);
  if (!input) {
    throw new Error('Input de upload não encontrado');
  }
  await input.uploadFile(filePath);
}

async function getElementsByXPath(page, xpath) {
  return await page.evaluate((xpath) => {
    const result = [];
    const xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < xpathResult.snapshotLength; i++) {
      result.push(xpathResult.snapshotItem(i));
    }
    return result;
  }, xpath);
}

module.exports = {
  launchBrowser,
  saveCookies,
  loadCookies,
  clearCookies,
  waitForNavigationOrTimeout,
  clickButtonByText,
  uploadFileInput,
  getElementsByXPath
};