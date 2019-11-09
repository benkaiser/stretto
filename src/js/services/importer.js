import Playlist from '../models/playlist';
import Song from '../models/song';


export default class Importer {
  start(fileInputEvent) {
    return this.startImport(fileInputEvent);
  }

  startImport(fileInputEvent) {
    return this._readFileContents(fileInputEvent)
    .then(this._processInputText);
  }

  _readFileContents(fileInputEvent) {
    var file = fileInputEvent.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    var resolveLoad, rejectLoad;
    const promise = new Promise((resolve, reject) => {
      resolveLoad = resolve;
      rejectLoad = reject;
    });  
    reader.onload = function(e) {
      var contents = e.target.result;
      resolveLoad(contents);
    };
    reader.onerror = function(e) {
      rejectLoad(e);
    }
    reader.readAsText(file);
    return promise;
  }

  _processInputText(inputText) {
    const importedData = JSON.parse(inputText);
    Song.initialise(importedData.songs);
    Playlist.initialise(importedData.playlists);
    Song.change();
    Playlist.change();
  }
}
