Stretto (previously Node Music Player)
=================
#### An open source web-based music player

[![Join the chat at https://gitter.im/benkaiser/stretto](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/benkaiser/stretto?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![screenshot](https://cloud.githubusercontent.com/assets/608054/12073955/0b9a34c6-b0ef-11e5-83f5-04c6f3fed33c.png)

This is an experimental branch with a newly developed version of Stretto.
Soon there will be a hosted version of this so no developer installation is
needed.

### Developer Instructions

#### Running in Docker + Docker Compose

```
bin/go
```

And you're done! Good to go! try it out on http://localhost:3000

#### Without Docker

You'll need:
- Node.js 6
- Mongodb running

then execute

```
yarn
npm run webpack
npm start
```

You can also pass the `MONGO_URL` environment variable to the process to set the correct redis instance.
