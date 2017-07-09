const mongoose = require('mongoose');

let UserModel;

module.exports = class User {
  static initialize() {
    UserModel = mongoose.model('user', {
      email: String,
      version: { type: Number, default: -1 },
      googleObject: mongoose.Schema.Types.Mixed
    });
  }

  static bumpVersionForUser(user) {
    return new Promise((resolve, reject) => {
      const newVersion = +new Date();
      UserModel.update({ email: user.email }, { version: newVersion}, (err, numAffected, user) => {
        if (err) { return reject(err); }
        if (!numAffected) { return reject('No user to bump version for'); }
        resolve(newVersion);
      });
    });
  }

  static getVersionForUser(user) {
    return User._findOrCreate(user.email, user).then((user) => {
      return user.version;
    });
  }

  static _findOrCreate(email, googleObject) {
    return new Promise((resolve, reject) => {
      UserModel.findOne({ 'email': email }, (err, user) => {
        if (err) { return reject(err); }
        if (user) { return resolve(user); }
        UserModel.create({
          email: email,
          googleObject: googleObject
        }, (err, user) => {
          if (err) { return reject(err); }
          console.log(user);
          resolve(user);
        });
      });
    });
  }
}
