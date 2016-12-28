class TextWrapper {
  constructor(raw) {
    this.conversations = raw;
  }

  convert() {
    return this.conversations.map(this.convertMessage).join('\n');
  }

  convertMessage(msg) {
    let body = msg.body || '';
    return `${msg.senderName} [${msg.timestampDatetime}]: ${body}`;
  }
}

TextWrapper.description = 'TXT (plain text file)';

module.exports = TextWrapper;
