import DataLayer from './data_layer';
import Playlist from './playlist';
import Song from './song';

class ModelInitialiser {
  static createChangeListener(key) {
    return (data) => {
      DataLayer.setItem(key, data);
    };
  }

  static initialise() {
    Song.initialise(DataLayer.getItem('songs') || []);
    Playlist.initialise(DataLayer.getItem('playlists') || []);
    Song.addOnChangeListener(ModelInitialiser.createChangeListener('songs'));
    Playlist.addOnChangeListener(ModelInitialiser.createChangeListener('playlists'));
    if (Playlist.isEmpty()) {
      ModelInitialiser.seed();
    }
  }

  static seed() {
    let songs = [];
    songs.push(Song.create({
      album: 'Queen of the Clouds',
      artist: 'Tove Lo',
      cover: 'http://is3.mzstatic.com/image/thumb/Music4/v4/71/3f/36/713f369e-30f6-1bce-3143-56b8e6a17d3f/source/1000x1000bb.jpg',
      discNumber: 1,
      explicit: false,
      genre: 'Alternative',
      id: 'SYM-RJwSGQ8',
      title: 'Habits (Stay High) [Hippie Sabotage Remix]',
      trackNumber: 16
    }));
    songs.push(Song.create({
      album: "Writer's Block",
      artist: 'Peter Bjorn and John',
      cover: 'http://is4.mzstatic.com/image/thumb/Music/v4/a7/94/78/a7947819-82e0-7458-8e3e-8587acc2cc0a/source/1000x1000bb.jpg',
      discNumber: 1,
      explicit: false,
      genre: 'Alternative',
      id: 'iArXv64tCJA',
      title: 'Young Folks',
      trackNumber: 3
    }));
    songs.push(Song.create({
      album: 'Startup Cult',
      artist: 'Allday',
      cover: 'http://is2.mzstatic.com/image/thumb/Music71/v4/ec/50/24/ec50246d-77f3-5066-f465-ad1a7fecc391/source/1000x1000bb.jpg',
      discNumber: 1,
      explicit: false,
      genre: 'Dance',
      id: 'YAMEls7RYoc',
      title: 'You Always Know the DJ',
      trackNumber: 4
    }));
    Playlist.create({
      title: "Library",
      songs: songs.map((song) => song.id)
    });
  }
}

module.exports = ModelInitialiser;
