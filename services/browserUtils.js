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

async function fillAndValidateField(page, selectors, text, agentStatus) {
  /**
   * Tenta preencher um campo de texto com múltiplos seletores e valida se foi preenchido
   * @param {Page} page - Página do Puppeteer
   * @param {string|Array} selectors - Seletor ou array de seletores CSS
   * @param {string} text - Texto a preencher
   * @param {Object} agentStatus - Objeto para logging
   * @returns {boolean} - True se conseguiu preencher e validar, False caso contrário
   */
  
  const selectorList = Array.isArray(selectors) ? selectors : [selectors];
  
  for (const selector of selectorList) {
    try {
      const element = await page.$(selector);
      if (!element) continue;
      
      // Clicar no elemento
      await element.click({ delay: 100 });
      await element.focus();
      
      // Aguardar visibilidade
      await page.waitForTimeout(200);
      
      // Limpar campo
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(100);
      
      // Digitar texto
      await page.keyboard.type(text, { delay: 5 });
      await page.waitForTimeout(500);
      
      // Validar se texto foi preenchido
      const filledText = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el?.textContent || el?.value || '';
      }, selector);
      
      if (filledText && filledText.includes(text.substring(0, 10))) {
        agentStatus.log(`✅ Campo preenchido com: "${text.substring(0, 40)}..."`);
        return true;
      }
    } catch (e) {
      // Continuar para próximo seletor
    }
  }
  
  // Fallback: usar evaluate
  try {
    const success = await page.evaluate((textToFill) => {
      const elements = document.querySelectorAll('textarea, div[contenteditable], input[type="text"]');
      for (let elem of elements) {
        if (elem.offsetHeight > 0 && (elem.tagName === 'TEXTAREA' || elem.contentEditable === 'true')) {
          elem.focus();
          elem.textContent = textToFill;
          elem.value = textToFill;
          elem.dispatchEvent(new Event('input', { bubbles: true }));
          elem.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Validar
          const currentText = elem.textContent || elem.value;
          return currentText.includes(textToFill.substring(0, 10));
        }
      }
      return false;
    }, text);
    
    if (success) {
      agentStatus.log(`✅ Campo preenchido via evaluate: "${text.substring(0, 40)}..."`);
      return true;
    }
  } catch (e) {
    agentStatus.log(`⚠️ Erro ao validar preenchimento: ${e.message}`);
  }
  
  agentStatus.log(`❌ Não conseguiu preencher campo. Texto pode estar vazio.`);
  return false;
}

module.exports = {
  launchBrowser,
  saveCookies,
  loadCookies,
  clearCookies,
  waitForNavigationOrTimeout,
  clickButtonByText,
  uploadFileInput,
  getElementsByXPath,
  fillAndValidateField
};