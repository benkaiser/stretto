var Exporter = function Exporter() {
  this.export = function() {
    value = 'test';
    bootbox.dialog({
      title: 'Exporter',
      message: '<p>Copy and paste the below data into the <a target=\'_blank\' href=\'https://next.kaiserapps.com\'>stretto-next</a> importer:</p>' +
               '<textarea>' + this._exportJSON() + '</textarea>',
      closeButton: true
    });
  }

  this._convertSongForExport = function(song) {
    return {
      album: song.album,
      artist: song.display_artist,
      date_added: song.date_added,
      date_modified: song.date_modified,
      disc: song.disc,
      duration: song.duration,
      play_count: song.play_count,
      playlists: [],
      title: song.title,
      track: song.track
    }
  }

  this._exportJSON = function() {
    return this._safeStringify({
      songs: this._songsData()
    });
  }

  this._safeStringify = function(obj) {
    return JSON.stringify(obj).replace(/</g,"&lt;").replace(/>/g,"&gt;")
  }

  this._songsData = function() {
    let songMap = {};
    for (key in player.song_collection.models) {
      song = player.song_collection.models[key].attributes;
      songMap[song._id] = this._convertSongForExport(song);
    }
    this._backfillPlaylists(songMap);
    return Object.values(songMap);
  }

  this._backfillPlaylists = function(songMap) {
    for (key in player.playlist_collection.models) {
      let playlist = player.playlist_collection.models[key].attributes;
      if (!playlist.editable) { continue; }
      for (key in playlist.songs) {
        songMap[playlist.songs[key]._id] &&
          songMap[playlist.songs[key]._id].playlists.push(playlist.title);
      }
    }
  }
}
