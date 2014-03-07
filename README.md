Node Music Player
=================
#### An open source web-based music player

![alt tag](https://f.cloud.github.com/assets/608054/2256870/25a93a38-9e0e-11e3-8432-b0cc2e2c896f.png)

### How does it work?
Run it on your computer or server containing your music library and then access it through `<ip of computer>:2000`, for example if you run it on your local computer you would use `localhost:2000`.

### Installation Instructions
##### Dependencies
[node](http://nodejs.org/), [git](http://git-scm.com/)

You will also need a package `taglib` installed. On Ubuntu and derivatives this is `libtag1-dev`, on Arch Linux `taglib`.
On OSX you will need homebrew, the xcode developer tools, and then run `brew install taglib` to install taglib ([more info here](https://github.com/Homebrew/homebrew/wiki/Installation)).
Windows support is not guaranteed and is up to someone else to submit any pull requests for windows support.

Install with the following commands:
```
git clone git@github.com:benkaiser/node-music-player.git
cd node-music-player/
npm install
```

Edit the `config.js` file and set `music_dir` to be the folder you want to be scanned for your music.

Then run the server with:
```
node app.js
```
Go to `localhost:2000` in your browser (or known ip of server if it is on a different machine). From there click the `Scan Library` tab at the top of the page. From there select `Start Scan` and let it do it's magic. Once your library is scanned you should be able to access it from the `Music` tab up the top.

### Features Implemented

- Play songs and move between tracks
- View full-resolution cover art
- Full playlist support
- Multiple selection
- Repeat, repeat one and shuffle
- Search functionality

### Planned features

- Cross-device syncing over network (between computers and android devices)
- Remote controlling from other devices (i.e. phones, tablets, other computers)
- Mobile viewing, so one may play and listen their library in an intuitive interface for a mobile phone
- Favourite artists section

### FAQ

#### Q: Why do you use taglib?

A: We depend on the [musicmetadata](https://github.com/leetreveil/musicmetadata) library for scanning most song attributes including cover photos, however scanning song duration in [musicmetadata](https://github.com/leetreveil/musicmetadata) is really slow. Taglib solves this problem by implementing extremely fast scanning of track audio attributes (i.e song length). If you really wish to install without taglib, just strip out all the taglib code in `library_functions.js` (the application should function as normal, just without song durations displayed).
