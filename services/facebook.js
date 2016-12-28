let async = require('async');
let facebookChatApi = require('facebook-chat-api');
let fs = require('fs');
let util = require('util');

let accounts = [];
class Facebook {
  static login(email, password) {
    return new Promise((resolve, reject) => {
      facebookChatApi({email: email, password: password }, (err, api) => {
        if (err) reject(err);
        resolve(new Facebook(api));
      });
    });
  }

  constructor(api) {
    this.api = api;
  }

  conversationDecorator(conversation) {
    conversation.otherParticipants = conversation.participants.slice(0, -1);
    return conversation;
  }

  getConversations(callback) {
    this.api.getThreadList(0, 10, 'inbox', (err, rawConversations) => {
      async.map(rawConversations, (raw, done) => {
        this.api.getThreadInfo(raw.threadID, (err, conversation) => {
          raw.full = conversation;
          done(null, this.conversationDecorator(raw));
        });
      }, (err, conversations) => {
        if (err) console.log(err);
        callback(conversations);
      });
    });
  }

  getConversation(threadId, callback) {
    this.api.getThreadInfo(threadId, (err, info) => {
      let iteration = 0;
      let chunkSize = 9999;
      let lastTimestamp = +Date.now();
      let allMessages = [];
      async.until(() => (iteration * chunkSize) > info.messageCount, (next) => {
        this.api.getThreadHistory(threadId, 0, chunkSize, lastTimestamp, (err, history) => {
          if (err) { console.log(err); }

          allMessages = history.concat(allMessages);
          lastTimestamp = history[0].timestamp - 1;
          iteration++;
          next();
        });
      }, () => {
        callback(allMessages);
      });
    });
  }
}

module.exports = Facebook;
