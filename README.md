Node Music Player
=================
#### An open source web-based music player

![screenshot](https://cloud.githubusercontent.com/assets/608054/3919259/b1ab3a00-23a5-11e4-94ad-859051b06626.jpg)

### Live Demo
You can view a version I have hosted on one of my personal servers at [http://xpressen.com:2020](http://xpressen.com:2020).

To have the full functionality and to use your own music please follow the install instructions below.

The music I have used for the hosted version is copyright of [Social Club](http://martymar.goodcitymusic.com/).
To purchase or download their music visit [their website](http://martymar.goodcitymusic.com/).

### How does it work?
Run it on your computer or server containing your music library and then access it through `<ip of computer>:2000`, for example if you run it on your local computer you would use `localhost:2000`.

### Installation Instructions
##### Dependencies
[node](http://nodejs.org/), [git](http://git-scm.com/)

For the Youtube download and converison, make sure you have [ffmpeg](https://ffmpeg.org/) installed on your system (including all necessary encoding libraries like libmp3lame or libx264).
Windows support is not guaranteed and is up to someone else to submit any pull requests for windows support.

Install with the following commands:
```
git clone https://github.com/benkaiser/node-music-player.git
cd node-music-player/
npm install
```

Edit the `config.js` file and set `music_dir` to be the folder you want to be scanned for your music.

Then run the server with:
```
node app.js
```
Go to `localhost:2000` in your browser (or known ip of server if it is on a different machine). From there click the `Scan Library` tab at the top of the page. From there select `Start Scan` and let it do it's magic. Once your library is scanned you should be able to access it from the `Music` tab up the top.

### Android Sync App

If you want to sync your Node Music Player playlists to your phone, [check out the android sync app repository](https://github.com/benkaiser/android-node-music-sync).

### Remote Control Shortcuts

If you would like to hook up keyboard shortcuts to play/pause/next/prev when you aren't currently focused
on the chrome follow these steps:

1. first set your remote name from the `Remote Setup` button in the bottom right.
![set_remote_name](https://cloud.githubusercontent.com/assets/608054/6090658/9520f106-aecc-11e4-9d77-1a1822ade842.jpg)

2. In whatever program you use to configure your shortcuts, link the button press you want to curl commands of the format:
`curl http://localhost:2000/command/<remote_name>/<command>` where `<remote_name>` is the remote name you entered and  `<command>` can be either `next`, `prev` or `playpause`.
For an example, here is my i3 config bindings that hook up Alt+PgDn, Alt+PgUp and Alt+Home to the commands:
```
bindsym $mod+Home exec curl http://localhost:2000/command/my_remote_name/playpause
bindsym $mod+Next exec curl http://localhost:2000/command/my_remote_name/prev
bindsym $mod+Prior exec curl http://localhost:2000/command/my_remote_name/next
```


### Features Implemented

- Sync between computers (servers running on different computers)
- Download from youtube and soundcloud
- View full-resolution cover art
- Full playlist support
- Multiple selection
- Repeat, repeat one and shuffle
- Search functionality

### Planned features

- See the projects public [Trello board](https://trello.com/b/cXdOSOoR/node-music-player) for features planned / implemented. If you want to request a feature, please [create an issue](https://github.com/benkaiser/node-music-player/issues/new).
