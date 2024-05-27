const mongoose = require('mongoose');
var crypto = require('crypto');

let UserModel;

module.exports = class User {
  static initialize() {
    const schema = new mongoose.Schema({
      email: String,
      hash : String,
      salt : String,
      resetToken: String,
      publicJsonLibrary: Boolean,
      version: { type: Number, default: -1 },
      googleObject: mongoose.Schema.Types.Mixed
    });
    schema.methods.setPassword = function(password) {
      this.salt = crypto.randomBytes(16).toString('hex');
      this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, `sha512`).toString(`hex`);
    };
    schema.methods.validPassword = function(password) {
      if (!this.salt) {
        return false;
      }
      var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, `sha512`).toString(`hex`);
      return this.hash === hash;
    };

    UserModel = mongoose.model('user', schema);
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

  static setPublicJsonLibrary(user, isPublic) {
    return User._find(user.email).then((user) => {
      console.log('Saving to user');
      user.publicJsonLibrary = isPublic;
      return new Promise((resolve, reject) => {
        user.save((err) => {
          if (err) { return reject(err); }
          resolve();
        });
      });
    });
  }

  static isPublicJsonLibrary(email) {
    return User._find(email).then((user) => {
      return user.publicJsonLibrary;
    });
  }

  static createAccount(email, password) {
    return new Promise((resolve, reject) => {
      UserModel.findOne({ email: email }, (err, user) => {
        if (user) {
          reject('User already exists, please login.');
        } else {
          let newUser = new UserModel();
          newUser.email = email;
          newUser.setPassword(password);
          newUser.save((err, user) => {
            if (err) { reject('Failed to create user. ' + err); }
            return resolve(user);
          });
        }
      });
    });
  }

  static createAccountForGoogleUser(email, googleObject) {
    return new Promise((resolve, reject) => {
      UserModel.findOne({ email: email }, (err, user) => {
        if (user) {
          reject('User already exists, please login.');
        } else {
          let newUser = new UserModel();
          newUser.email = email;
          newUser.googleObject = googleObject;
          newUser.save((err, user) => {
            if (err) { reject('Failed to create user. ' + err); }
            return resolve(user);
          });
        }
      });
    });
  }

  static login(email, password) {
    return new Promise((resolve, reject) => {
      UserModel.findOne({ email: email }, (err, user) => {
        if (user === null || user === undefined) {
          reject("Incorrect email or password, please try again.");
        } else {
          if (user.validPassword(password)) {
            return resolve(user);
          } else {
            reject('Incorrect email or password, please try again.');
          }
        }
      });
    });
  }

  static getUser(email) {
    return new Promise((resolve, reject) => {
      UserModel.findOne({ email: email }, (err, user) => {
        if (err) {
          reject('Failed to get user. ' + err);
        } else if (user === null || user === undefined) {
          reject('No user found with this email.');
        } else {
          resolve(user);
        }
      });
    });
  }

  static getPasswordResetForUser(email) {
    return new Promise((resolve, reject) => {
      UserModel.findOne({ email: email }, (err, user) => {
        if (user === null || user === undefined) {
          reject("Unable to locate user.");
        } else {
          user.resetToken = crypto.randomBytes(16).toString('hex');
          user.save((err, user) => {
            if (err) { reject('Failed to save reset token to user. ' + err); }
            return resolve(user.resetToken);
          });
        }
      });
    });
  }

  static completePasswordReset(email, password, token) {
    return new Promise((resolve, reject) => {
      if (token === '') {
        return reject('Reset token is empty');
      }
      UserModel.findOne({ email: email, resetToken: token }, (err, user) => {
        if (user === null || user === undefined) {
          reject("Unable to find user with reset token and email.");
        } else {
          user.resetToken = '';
          user.setPassword(password);
          user.save((err, user) => {
            if (err) { reject('Failed to save reset token to user. ' + err); }
            return resolve();
          });
        }
      });
    });
  }

  static _find(email) {
    return new Promise((resolve, reject) => {
      UserModel.findOne({ 'email': email }, (err, user) => {
        if (err) { return reject(err); }
        if (user) { return resolve(user); }
        reject('Unable to find user');
      });
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
