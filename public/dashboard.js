const socket = io();

// ============================================
// UTILIDADES GERAIS
// ============================================

function updateTime() {
  const now = new Date();
  document.getElementById('time').textContent = now.toLocaleTimeString('pt-BR');
}
setInterval(updateTime, 1000);
updateTime();

// ============================================
// GERENCIAMENTO DE MODAIS E JANELAS
// ============================================

class ModalManager {
  constructor() {
    this.currentNetwork = null;
    this.initializeModals();
    this.initializeWindows();
  }

  initializeModals() {
    document.getElementById('btn-settings-header').addEventListener('click', () => {
      this.openModal('modal-settings');
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      this.openModal('modal-settings');
    });

    document.querySelectorAll('.btn-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.closeModal(modal.id);
      });
    });

    document.querySelectorAll('.network-item.clickable').forEach(item => {
      item.addEventListener('click', () => {
        this.currentNetwork = item.dataset.network;
        this.openConnectModal(this.currentNetwork);
      });
    });

    document.getElementById('btn-settings-save').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('btn-connect-now').addEventListener('click', () => {
      this.connectNetwork();
    });
  }

  initializeWindows() {
    document.getElementById('btn-toggle-preview').addEventListener('click', () => {
      this.toggleWindow('window-preview');
    });

    document.getElementById('btn-toggle-terminal').addEventListener('click', () => {
      this.toggleWindow('window-terminal');
    });

    document.getElementById('btn-close-preview').addEventListener('click', () => {
      document.getElementById('window-preview').style.display = 'none';
    });

    document.getElementById('btn-close-terminal').addEventListener('click', () => {
      document.getElementById('window-terminal').style.display = 'none';
    });

    document.querySelectorAll('.preview-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchPreviewTab(e.target.dataset.tab);
      });
    });

    this.initializeImageEditor();
    this.initializeTerminal();
    this.makeDraggable('window-preview');
    this.makeDraggable('window-terminal');
  }

  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  toggleWindow(windowId) {
    const window = document.getElementById(windowId);
    window.style.display = window.style.display === 'none' ? 'block' : 'none';
  }

  openConnectModal(network) {
    const title = document.getElementById('modal-connect-title');
    const info = document.getElementById('connect-info');
    const statusText = document.getElementById('connection-status-text');

    const networkInfo = {
      facebook: {
        title: 'Conectar no Facebook',
        info: 'O sistema usará Puppeteer para fazer login. Você fará login manualmente no navegador que abrir.'
      },
      instagram: {
        title: 'Conectar no Instagram',
        info: 'O Instagram pode pedir verificação em 2 fatores. Tenha seu telefone à mão.'
      },
      pinterest: {
        title: 'Conectar no Pinterest',
        info: 'O Pinterest é geralmente mais fácil. Login simples com email ou rede social.'
      },
      tiktok: {
        title: 'Conectar no TikTok',
        info: 'TikTok pode ser mais restritivo. Pode pedir QR code ou verificação.'
      }
    };

    const info_data = networkInfo[network];
    title.textContent = info_data.title;
    info.textContent = info_data.info;
    statusText.textContent = 'Status: Aguardando ação...'

    this.openModal('modal-connect');
  }

  connectNetwork() {
    const network = this.currentNetwork;
    const statusText = document.getElementById('connection-status-text');
    
    statusText.textContent = `Conectando no ${network}...`;
    socket.emit('connect-network', { network });
  }

  saveSettings() {
    const settings = {
      frequency: document.getElementById('setting-frequency').value,
      imageQuality: document.getElementById('setting-image-quality').value,
      videoDuration: document.getElementById('setting-video-duration').value,
      autoEdit: document.getElementById('setting-auto-edit').checked,
      notifications: document.getElementById('setting-notifications').checked,
      primaryApi: document.getElementById('setting-primary-api').value
    };

    socket.emit('update-settings', settings);
    this.closeModal('modal-settings');
    addLog('Configurações salvas com sucesso!');
  }

  switchPreviewTab(tab) {
    document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.preview-tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
  }

  initializeImageEditor() {
    const canvas = document.getElementById('image-editor-canvas');
    const ctx = canvas.getContext('2d');
    let currentImage = null;
    let edits = {
      contrast: 0,
      brightness: 0,
      saturation: 0,
      rotation: 0
    };

    document.addEventListener('click', (e) => {
      if (e.target.closest('.gallery-item img')) {
        const img = e.target;
        currentImage = new Image();
        currentImage.crossOrigin = 'anonymous';
        currentImage.src = img.src;
        currentImage.onload = () => {
          this.drawImage(canvas, currentImage, edits);
        };
      }
    });

    const redraw = () => {
      if (currentImage) {
        this.drawImage(canvas, currentImage, edits);
      }
    };

    document.getElementById('editor-contrast').addEventListener('input', (e) => {
      edits.contrast = parseInt(e.target.value);
      redraw();
    });

    document.getElementById('editor-brightness').addEventListener('input', (e) => {
      edits.brightness = parseInt(e.target.value);
      redraw();
    });

    document.getElementById('editor-saturation').addEventListener('input', (e) => {
      edits.saturation = parseInt(e.target.value);
      redraw();
    });

    document.getElementById('editor-rotation').addEventListener('input', (e) => {
      edits.rotation = parseInt(e.target.value);
      redraw();
    });

    document.getElementById('btn-editor-reset').addEventListener('click', () => {
      edits = { contrast: 0, brightness: 0, saturation: 0, rotation: 0 };
      document.getElementById('editor-contrast').value = 0;
      document.getElementById('editor-brightness').value = 0;
      document.getElementById('editor-saturation').value = 0;
      document.getElementById('editor-rotation').value = 0;
      redraw();
    });

    document.getElementById('btn-editor-download').addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `edited-${Date.now()}.png`;
      link.click();
    });

    document.getElementById('btn-editor-apply').addEventListener('click', () => {
      addLog(`Edições aplicadas: Contraste ${edits.contrast}, Brilho ${edits.brightness}`);
    });
  }

  drawImage(canvas, img, edits) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((edits.rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const contrast = (100 + edits.contrast) / 100;
    const brightness = (100 + edits.brightness) / 100;
    const saturation = (100 + edits.saturation) / 100;

    ctx.filter = `contrast(${contrast}) brightness(${brightness}) saturate(${saturation})`;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  initializeTerminal() {
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const command = input.value.trim();
        input.value = '';

        if (command) {
          this.executeCommand(command, output);
        }
      }
    });
  }

  executeCommand(command, output) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `$ ${command}`;
    output.appendChild(line);

    const commands = {
      help: () => {
        return `Comandos disponíveis: help, status, preview, post now, clear, settings`;
      },
      status: () => {
        return `Status: ${document.getElementById('agent-status').textContent}`;
      },
      preview: () => {
        document.getElementById('btn-generate-preview').click();
        return 'Solicitando prévia...';
      },
      'post now': () => {
        document.getElementById('btn-post-now').click();
        return 'Solicitando postagem direta...';
      },
      clear: () => {
        output.innerHTML = '<div class="terminal-line">Sistema pronto para comandos...</div>';
        return null;
      }
    };

    const result = commands[command] ? commands[command]() : `Comando não encontrado. Digite 'help'`;

    if (result !== null) {
      const resultLine = document.createElement('div');
      resultLine.className = 'terminal-line';
      resultLine.textContent = result;
      output.appendChild(resultLine);
    }

    output.scrollTop = output.scrollHeight;
  }

  makeDraggable(elementId) {
    const element = document.getElementById(elementId);
    const header = element.querySelector('.window-header');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = () => {
        document.onmouseup = null;
        document.onmousemove = null;
      };
      document.onmousemove = (e) => {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + 'px';
        element.style.left = (element.offsetLeft - pos1) + 'px';
      };
    };
  }
}

// ============================================
// GALERIA
// ============================================

class GalleryManager {
  constructor() {
    this.images = [];
    this.videos = [];
  }

  addImage(src, timestamp) {
    this.images.push({ src, timestamp });
    this.updateGallery();
  }

  addVideo(src, timestamp) {
    this.videos.push({ src, timestamp });
    this.updateGallery();
  }

  updateGallery() {
    const imagesContainer = document.getElementById('gallery-images');
    if (this.images.length > 0) {
      imagesContainer.innerHTML = this.images.map(img => `
        <div class="gallery-item">
          <img src="${img.src}" alt="Generated image">
          <div class="gallery-item-info">${new Date(img.timestamp).toLocaleTimeString('pt-BR')}</div>
        </div>
      `).join('');
    } else {
      imagesContainer.innerHTML = '<div class="gallery-placeholder">Nenhuma imagem gerada ainda</div>';
    }

    const videosContainer = document.getElementById('gallery-videos');
    if (this.videos.length > 0) {
      videosContainer.innerHTML = this.videos.map(vid => `
        <div class="gallery-item">
          <video controls>
            <source src="${vid.src}" type="video/mp4">
          </video>
          <div class="gallery-item-info">${new Date(vid.timestamp).toLocaleTimeString('pt-BR')}</div>
        </div>
      `).join('');
    } else {
      videosContainer.innerHTML = '<div class="gallery-placeholder">Nenhum vídeo gerado ainda</div>';
    }
  }
}

// ============================================
// INICIALIZAR
// ============================================

const modalManager = new ModalManager();
const galleryManager = new GalleryManager();

// ============================================
// FUNÇÕES DO SOCKET
// ============================================

socket.on('connect', () => {
  console.log('Conectado ao servidor');
  updateStatus('online', 'Conectado');
});

socket.on('disconnect', () => {
  console.log('Desconectado');
  updateStatus('offline', 'Desconectado');
});

socket.on('agent-status', (data) => {
  document.getElementById('agent-status').textContent = data.status;
  document.getElementById('current-task').textContent = data.task || 'Nenhuma';

  const statusMap = {
    'idle': 'online',
    'working': 'working',
    'paused': 'offline'
  };
  updateStatus(statusMap[data.status] || 'offline', data.status);
});

socket.on('task-update', (data) => {
  document.getElementById('current-task').textContent = data.task;
  updateProgress(data.progress || 0);
  addLog(data.message || data.task);
});

socket.on('login-status', (data) => {
  updateNetworkStatus(data.network, data.logged);
});

socket.on('ai-tool-status', (data) => {
  updateAIToolStatus(data.tool, data.status, data.provider);
});

socket.on('new-log', (message) => {
  addLog(message);
});

socket.on('next-posts-update', (posts) => {
  updateNextPosts(posts);
});

socket.on('connect-status', (data) => {
  document.getElementById('connection-status-text').textContent = `Status: ${data.status}`;
});

socket.on('preview-ready', (data) => {
  showPreview(data);
  addLog('Prévia gerada com sucesso');
});

socket.on('preview-error', (data) => {
  addLog(`Erro na prévia: ${data.message}`);
});

socket.on('gallery-update', (data) => {
  if (data.type === 'image') {
    galleryManager.addImage(data.src, data.timestamp);
  } else if (data.type === 'video') {
    galleryManager.addVideo(data.src, data.timestamp);
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function updateStatus(status, text) {
  const indicator = document.getElementById('status-indicator');
  indicator.className = `status-${status}`;
  indicator.textContent = (status === 'online' ? '● ' : status === 'working' ? '◆ ' : '● ') + (text || status);
}

function updateProgress(percent) {
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  fill.style.width = Math.min(percent, 100) + '%';
  text.textContent = Math.min(percent, 100) + '%';
}

function updateNetworkStatus(network, logged) {
  const statusElement = document.getElementById(network.toLowerCase() + '-status');
  if (statusElement) {
    statusElement.className = 'status-dot ' + (logged ? 'online' : 'offline');
  }
}

function updateAIToolStatus(tool, status, provider) {
  const element = document.getElementById('tool-' + tool);
  if (element) {
    element.textContent = provider || status;
    element.className = 'tool-status';
    if (status === 'loading') element.classList.add('loading');
    else if (status === 'error') element.classList.add('error');
  }
}

function addLog(message) {
  const log = document.getElementById('activity-log');
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR');

  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="log-message">${message}</span>`;

  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;

  while (log.children.length > 100) {
    log.removeChild(log.firstChild);
  }
}

function updateNextPosts(posts) {
  const container = document.getElementById('next-posts');
  container.innerHTML = '';
  posts.forEach(post => {
    const item = document.createElement('div');
    item.className = 'post-item';
    item.innerHTML = `
      <span class="post-time">${post.time}</span>
      <span class="post-status">${post.status}</span>
    `;
    container.appendChild(item);
  });
}

function showPreview({ imageUrl, videoUrl, caption, prompt }) {
  const previewPanel = document.getElementById('preview-summary');
  document.getElementById('preview-prompt').textContent = prompt || '—';
  document.getElementById('preview-caption').textContent = caption || '—';
  const img = document.getElementById('preview-image');
  const video = document.getElementById('preview-video');

  if (imageUrl) {
    img.src = imageUrl;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  if (videoUrl) {
    video.src = videoUrl;
    video.style.display = 'block';
  } else {
    video.style.display = 'none';
  }

  previewPanel.classList.remove('hidden');
}

// ============================================
// EVENT LISTENERS INICIAIS
// ============================================

document.getElementById('btn-test-post').addEventListener('click', () => {
  socket.emit('test-post');
  addLog('Testando postagem...');
});

document.getElementById('btn-generate-preview').addEventListener('click', () => {
  const imagePrompt = document.getElementById('command-image-prompt').value.trim();
  const videoPrompt = document.getElementById('command-video-prompt').value.trim();
  const caption = document.getElementById('command-caption').value.trim();
  socket.emit('generate-preview', { imagePrompt, videoPrompt, caption });
  addLog('Solicitando prévia...');
});

document.getElementById('btn-post-now').addEventListener('click', () => {
  const imagePrompt = document.getElementById('command-image-prompt').value.trim();
  const videoPrompt = document.getElementById('command-video-prompt').value.trim();
  const caption = document.getElementById('command-caption').value.trim();
  socket.emit('post-now', { imagePrompt, videoPrompt, caption });
  addLog('Solicitando postagem direta...');
});

document.getElementById('btn-pause').addEventListener('click', () => {
  socket.emit('pause-agent');
  addLog('Agente pausado');
});

document.getElementById('btn-resume').addEventListener('click', () => {
  socket.emit('resume-agent');
  addLog('Agente retomado');
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'p' || e.key === 'P') {
      modalManager.toggleWindow('window-preview');
      e.preventDefault();
    }
    if (e.key === 't' || e.key === 'T') {
      modalManager.toggleWindow('window-terminal');
      e.preventDefault();
    }
  }
});

socket.on('connect', () => {
  socket.emit('request-status');
});