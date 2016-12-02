Stretto (previously Node Music Player)
=================
#### An open source web-based music player

[![Join the chat at https://gitter.im/benkaiser/stretto](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/benkaiser/stretto?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![screenshot](https://cloud.githubusercontent.com/assets/608054/12073955/0b9a34c6-b0ef-11e5-83f5-04c6f3fed33c.png)

### Live Demo
You can view a version I have hosted on my personal server at [http://music.kaiserapps.com/](http://music.kaiserapps.com/).

To have the full functionality and to use your own music please follow the install instructions below.

The music I have used for the hosted version is copyright of [Social Club](http://martymar.goodcitymusic.com/).
To purchase or download their music visit [their website](https://socialxclub.bandcamp.com).

### User Installation Instructions

Visit the [releases page](https://github.com/benkaiser/stretto/releases) for the latest release, and select the download for your platform. Unzip the download and run either the `Stretto.exe` on Windows, `Stretto.app` on Mac or the `Stretto` executable on Linux.

### Dev Installation Instructions
##### Dependencies

[node](http://nodejs.org/), [git](http://git-scm.com/), [npm](http://npmjs.org)

If you have any issues during install, make sure you are running the latest version of Nodejs and Npm.

For the Youtube download and converison, make sure you have [ffmpeg](https://ffmpeg.org/) installed on your system (including all necessary encoding libraries like libmp3lame or libx264).
Windows users can install ffmpeg from [Zeranoe](http://ffmpeg.zeranoe.com/builds/).

After all the dependencies have been installed, run these commands to install the music player:
```
git clone --depth=1 https://github.com/benkaiser/stretto.git
cd stretto/
npm install
```

Then run the server with:
```
node app.js
```

Alternatively, install PM2 (read more about PM2 at [pm2.keymetrics.io](http://pm2.keymetrics.io/))with `npm install -g pm2` and run the server persistently with:
```
pm2 start app.js
```

Go to `localhost:2000` in your browser (or known IP of server if it is on a different machine). From there a prompt will allow you to change your music directory, after saving your music directory you can click `Scan Library -> Regular Scan` at the top of the page. From there select `Start Scan` and let it do it's magic adding all the songs to your library. Happy listening!

### Submitting issues

Please include:

- operating system
- architecture (32bit or 64bit)
- nodejs version `node --version`
- npm version `npm --version`

Then include steps to reproduce followed by what you were aiming to do / expected to happen, and what did happen.

### Android Sync App

If you want to sync your Stretto playlists to your Android phone, [check out Stretto Sync](https://github.com/benkaiser/stretto-android-sync).

And if you like using Stretto, consider buying my a slurpee by purchasing the play store version:

[![Stretto Sync on Google Play](https://cloud.githubusercontent.com/assets/608054/19828055/8d4ed4b0-9dff-11e6-8780-96564d414b3a.png)](https://play.google.com/store/apps/details?id=com.kaiserapps.benkaiser.strettoandroidsync)

![sluree](https://cloud.githubusercontent.com/assets/608054/19828043/418046cc-9dff-11e6-936a-460d79b830ab.jpg)

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

#### Defining Features

- Sync between computers (share your library with your friends!)
- Android sync application [Stretto Sync](https://github.com/benkaiser/stretto-android-sync)
- Generate mix from songs streamed from YouTube, allowing you to explore new music from your current library
- Download from YouTube and SoundCloud
- Built in the open with other open source libraries

#### Simple Features
- View full-resolution cover art
- Full playlist support
- Multiple selection
- Repeat, repeat one and shuffle
- Search functionality

### Planned features

- See the [Github task  board](https://github.com/benkaiser/stretto/projects/1) for the product roadmap. If you want to request a feature, please [create an issue](https://github.com/benkaiser/stretto/issues/new).

### License

[MIT](https://opensource.org/licenses/MIT)
