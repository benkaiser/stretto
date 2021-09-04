[Stretto](https://next.kaiserapps.com/)
=================
#### An open source web-based music player

[![Join the chat at https://gitter.im/benkaiser/stretto](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/benkaiser/stretto?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![screenshot](https://user-images.githubusercontent.com/608054/51808037-8e79a200-2243-11e9-8275-6b2e34153e09.png)

[Go to Stretto](https://next.kaiserapps.com/), or if you would like to host it yourself, scroll down to the developer instructions.

## How does Stretto work?

Stretto works by backing every single one of your tracks with a video or song from youtube or soundcloud, and plays them transparently through an iframe embedded on the page.

Here is a list of some of the features Stretto has:

- [Import your playlists from Spotify](https://next.kaiserapps.com/spotify/)
- [Syncing between machines](https://next.kaiserapps.com/sync/) (by logging in with Google, PRs welcome for other auth methods)
- Automatic lyric fetching for the currently playing song
- [Music discovery through iTunes/Spotify top charts](https://next.kaiserapps.com/discover)
- Search iTunes and add tracks to library seamlessly
- Multiple themes available
- Completely free!
- [Android App](https://github.com/benkaiser/stretto-mobile-next/)

![image](https://user-images.githubusercontent.com/608054/51808164-2d52ce00-2245-11e9-87d8-d55058c2ef3f.png)

## Android App

A basic Android application is in the works here:
https://github.com/benkaiser/stretto-mobile-next/


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
- Node.js 10
- Mongodb running

Add your MONGO_URL settings to your environment variables, then execute

```
yarn
npm run dev
```

#### License

MIT