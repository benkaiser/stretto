var Datastore = require('nedb');

module.exports = function(app) {
  app.db = {};
  app.db.songs = new Datastore({ filename: app.get('configDir') + '/dbs/songs.db', autoload: true });
  app.db.playlists = new Datastore({ filename: app.get('configDir') + '/dbs/playlists.db', autoload: true });
  app.db.settings = new Datastore({ filename: app.get('configDir') + '/dbs/settings.db', autoload: true });
};
