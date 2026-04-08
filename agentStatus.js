class AgentStatus {
  constructor(io) {
    this.io = io;
    this.status = 'idle'; // idle, working, paused
    this.currentTask = 'Nenhuma';
    this.progress = 0;
    this.loginStatus = {
      facebook: false,
      instagram: false,
      pinterest: false,
      tiktok: false
    };
    this.aiTools = {
      'image-primary': { status: 'ready', provider: 'Hugging Face' },
      'image-fallback': { status: 'ready', provider: 'Stability AI' },
      'video': { status: 'ready', provider: 'Replicate' },
      'text': { status: 'ready', provider: 'Local/Ollama' }
    };
    this.isLogging = false;
  }

  updateStatus(status, task = null) {
    this.status = status;
    if (task) this.currentTask = task;
    this.broadcastStatus();
  }

  updateTask(task, progress = 0, message = '') {
    this.currentTask = task;
    this.progress = progress;
    if (this.io) {
      this.io.emit('task-update', { task, progress, message });
    }
  }

  setLoginStatus(network, logged) {
    this.loginStatus[network.toLowerCase()] = logged;
    if (this.io) {
      this.io.emit('login-status', { network, logged });
    }
  }

  setAIToolStatus(tool, status, provider = null) {
    if (this.aiTools[tool]) {
      this.aiTools[tool].status = status;
      if (provider) this.aiTools[tool].provider = provider;
      if (this.io) {
        this.io.emit('ai-tool-status', { 
          tool, 
          status, 
          provider: this.aiTools[tool].provider 
        });
      }
    }
  }

  log(message) {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${message}`);
    if (this.io) {
      this.io.emit('new-log', message);
    }
  }

  broadcastStatus() {
    if (this.io) {
      this.io.emit('agent-status', {
        status: this.status,
        task: this.currentTask,
        progress: this.progress,
        loginStatus: this.loginStatus,
        aiTools: this.aiTools
      });
    }
  }

  setNextPosts(posts) {
    if (this.io) {
      this.io.emit('next-posts-update', posts);
    }
  }
}

module.exports = AgentStatus;