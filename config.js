var path = require('path');
var request = require('request');
var async = require('async');

// export json of config
module.exports = function(app, callback) {
  return new Config(app);
};

// construct the object
function Config(app) {
  var self = this;
  this.demo = Boolean(process.env.DEMO || false);
  this.initialized = false;
  this.music_dir = '';
  this.music_dir_set = false;
  this.soundcloud = {
    dl_dir: 'soundcloud',
    client_id: '062e8dac092fe1ed9e16ee10dd88d566',
  };
  this.youtube = {
    dl_dir: 'youtube',
    quality: 'highest',
    api: 'AIzaSyBzVTAJq_j_WsltEa45EUaMHHmXlz8F_PM',
    parallel_download: 5,
  };

  // // Uncomment this block to set your own basic http authentication
  // this.auth = {
  //   username: 'username',
  //   password: 'password',
  // };

  // used for itunes metadata fetching (to select the store to search)
  this.country_code = 'us';

  // work out a default for the music directory
  // based on iTunes defaults https://support.apple.com/en-au/HT1391
  var home_dir = getUserHome();

  // this works on all platforms
  this.music_dir = path.join(home_dir, 'Music');

  // execute the two db calls in parrallel
  async.parallel([
      function(cb) {
        // override the music_dir if it is in the database
        app.db.settings.findOne({key: 'music_dir'}, function(err, item) {
          if (err) {
            console.log('Error fetching music_dir settings: ' + err);
          } else if (item && item.value) {
            // the music directory has been set in the database
            self.music_dir = item.value;
            self.music_dir_set = true;
          }

          // remove trailing seperator
          if (self.music_dir.lastIndexOf(path.sep) == self.music_dir.length - 1) {
            self.music_dir = self.music_dir.substr(0, self.music_dir.length - 1);
          }

          cb();
        });
      },

      function(cb) {
        // fetch the country code to override
        app.db.settings.findOne({key: 'country_code'}, function(err, item) {
          if (err) {
            console.log('Error fetching country_code settings: ' + err);
            cb();
          } else if (item && item.value) {
            // if the value returned, override the country_code
            self.country_code = item.value;
            cb();
          } else {
            // fetch the country code
            request({url:'http://ipinfo.io', json: true}, function(error, response, body) {
              // if the country was returned
              if (body && body.country) {
                // set it in the database
                var country = body.country.toLowerCase();
                app.db.settings.insert({key: 'country_code', value: country});
                self.country_code = country;
              }

              cb();
            });
          }
        });
      },
    ], function() {
      // set config as initialised and only call the callback if set
      self.initialized = true;
      if (self.initializedFn) {
        self.initializedFn();
      }
    }
  );
}

function getUserHome() {
  return process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
}
