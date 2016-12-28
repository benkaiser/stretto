let json2csv = require('json2csv');

class CsvWrapper {
  constructor(raw) {
    this.conversations = raw;
  }

  convert() {
    try {
      return json2csv({
        data: this.conversations,
        fields: ['senderName', 'body', 'timestampDatetime', 'timestamp'],
        fieldNames: ['sender', 'body', 'timestamp', 'timestamp (unix)'],
        defaultValue: '',
      });
    } catch(err) {
      console.error(err);
    }
  }
}

CsvWrapper.description = 'CSV (excel)';

module.exports = CsvWrapper;
