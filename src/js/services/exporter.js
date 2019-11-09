import Playlist from '../models/playlist';
import Song from '../models/song';
import moment from 'moment';

export default class Exporter {
  constructor() {
    this.startExport();
  }

  startExport() {
    const data = {
      playlists: Playlist.fetchAll(),
      songs: Song.fetchAll()
    };
    const date = moment().format("YYYY-MM-DD");
    this.downloadObjectAsJson(data, 'stretto_export_' + date);
  }

  downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}
