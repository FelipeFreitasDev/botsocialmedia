const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, 'config.json');
    this.defaultConfig = {
      frequency: '3h',
      imageQuality: 'medium',
      videoDuration: 15,
      autoEdit: true,
      notifications: true,
      primaryApi: 'huggingface',
      imageSource: 'both',
      networks: {
        facebook: false,
        instagram: false,
        pinterest: false,
        tiktok: false
      }
    };
    this.config = this.load();
  }

  load() {
    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        console.error('Erro ao carregar config:', error);
        return this.defaultConfig;
      }
    }
    return this.defaultConfig;
  }

  save(newConfig) {
    this.config = { ...this.config, ...newConfig };
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    return this.config;
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    this.save(this.config);
  }

  setNetworkStatus(network, status) {
    this.config.networks[network.toLowerCase()] = status;
    this.save(this.config);
  }

  getNetworkStatus(network) {
    return this.config.networks[network.toLowerCase()];
  }
}

module.exports = ConfigManager;