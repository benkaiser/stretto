class JsonWrapper {
  constructor(raw) {
    this.conversations = raw;
  }

  convert() {
    return JSON.stringify(this.conversations, null, 2);
  }
}

JsonWrapper.description = 'JSON';

module.exports = JsonWrapper;
