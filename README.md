Node Music Player
=================
#### An open source web-based music player

![alt tag](http://kaiserapps.com/links/node-music-player.png)

### How does it work?
Run it on your computer or server containing your music library and then access it through `<ip of computer>:2000`, for example if you run it on your local computer you would use `localhost:2000`.

### Installation Instructions
##### Dependencies
[node](http://nodejs.org/)

Install with the following commands:
```
npm i https://github.com/benkaiser/node-music-player/archive/master.tar.gz
cd node_modules/node-music-player/
```
Edit the `config.js` file and set `music_dir` to be the folder you want to be scanned for your music.

Then run the server with:
```
node server.js
```
Go to `localhost:2000` in your browser (or known ip of server if it is on a different machine). From there click the `Scan Library` tab at the top of the page. From there select `Start Scan` and let it do it's magic. Once your library is scanned you should be able to access it from the `Music` tab up the top.

### Features Implemented

- Play songs
- Move between tracks
- View full-resolution cover art
- Create playlists and add songs to them
- Repeat and repeat one

### Short-Term planned features

- Better playlist management (removing songs)
- Search functionality
- Favourite artists section
- Implement shuffling correctly
- Remote controlling from other devices (i.e. phones, tablets, other computers)
- Mobile viewing, so one may play and listen their library in an intuitive interface for a mobile phone