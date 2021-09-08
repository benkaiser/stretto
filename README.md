[Stretto](https://next.kaiserapps.com/)
=================
#### An open source web-based music player

![screenshot](https://user-images.githubusercontent.com/608054/51808037-8e79a200-2243-11e9-8275-6b2e34153e09.png)
![android-shadow-small webp](https://user-images.githubusercontent.com/608054/132454690-b09ac637-469d-4ec9-92df-629efb66c483.jpeg)

[Go to Stretto](https://next.kaiserapps.com/), or if you would like to host it yourself, scroll down to the developer instructions.

## How does Stretto work?

Stretto works by backing every single one of your tracks with a video or song from youtube or soundcloud. It then uses the [companion chrome extension](https://github.com/benkaiser/Stretto-Helper-Extension) to download the tracks to your browser directly.

Here is a list of some of the features Stretto has:

- [Import your playlists from Spotify](https://next.kaiserapps.com/spotify/)
- [Syncing libraries between machines](https://next.kaiserapps.com/sync/)
- Automatic lyric fetching for the currently playing song
- [Music discovery through iTunes/Spotify top charts](https://next.kaiserapps.com/discover)
- Search iTunes and add tracks to library seamlessly
- Multiple themes available
- Android Support via Kiwi Browser (see below)
- Completely free!

![image](https://user-images.githubusercontent.com/608054/51808164-2d52ce00-2245-11e9-87d8-d55058c2ef3f.png)

## Android App

Since Stretto works as a progressive web app, you can use Kiwi browser on Android to use it on mobile.
More information here: https://blog.kaiser.lol/stretto-music-player/#using-stretto-on-android


## Developer Instructions

Setup a .env file to setup your environment variables:

```
GOOGLE_CLIENT_ID=<...>
SPOTIFY_CLIENT_ID=<...>
SOUNDCLOUD_CLIENT_ID=<...>
```

#### Running in Docker + Docker Compose

```
bin/go
```

That's it! Go to http://localhost:3000

#### Without Docker

You'll need:
- Node.js 12
- Mongodb running

Add your MONGO_URL settings to your environment variables, then execute

```
yarn
npm run dev
```

#### License

MIT