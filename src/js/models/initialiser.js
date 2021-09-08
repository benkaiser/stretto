import DataLayer from './data_layer';
import Player from '../services/player';
import Playlist from './playlist';
import Song from './song';

export default class ModelInitialiser {
  static createChangeListener(key) {
    return (data) => {
      DataLayer.setItem(key, data.map((item) => item.serialize()));
    };
  }

  static initialise() {
    Song.initialise(DataLayer.getItem('songs') || []);
    Playlist.initialise(DataLayer.getItem('playlists') || []);
    Song.addOnChangeListener(ModelInitialiser.createChangeListener('songs'), false);
    Playlist.addOnChangeListener(ModelInitialiser.createChangeListener('playlists'));
    if (Playlist.isEmpty()) {
      ModelInitialiser.seed();
    }
    window.location.href.indexOf('/remote') == -1 && Player.resumeOnLoad();
  }

  static seed() {
    Playlist.create({
      title: Playlist.LIBRARY,
      songs: []
    });
  }
}