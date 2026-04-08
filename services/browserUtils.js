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
    page.waitForTimeout(timeout)
  ]);
}

async function clickButtonByText(page, labels, timeout = 20000) {
  const texts = Array.isArray(labels) ? labels : [labels];
  const conditions = texts
    .map((text) => `contains(normalize-space(string(.)), "${text}")`)
    .join(' or ');

  const xpath = `//button[${conditions}] | //a[${conditions}] | //div[${conditions}]`;
  await page.waitForXPath(xpath, { timeout });
  const elements = await page.$x(xpath);
  if (!elements || elements.length === 0) {
    throw new Error(`Botão com texto ${texts.join(', ')} não encontrado`);
  }

  await elements[0].focus();
  await elements[0].click();
  return elements[0];
}

async function uploadFileInput(page, selector, filePath) {
  await page.waitForSelector(selector, { visible: true, timeout: 20000 });
  const input = await page.$(selector);
  if (!input) {
    throw new Error('Input de upload não encontrado');
  }
  await input.uploadFile(filePath);
}

module.exports = {
  launchBrowser,
  saveCookies,
  loadCookies,
  clearCookies,
  waitForNavigationOrTimeout,
  clickButtonByText,
  uploadFileInput
};