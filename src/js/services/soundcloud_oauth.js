import SC from 'soundcloud';

export default class SoundcloudOAuth {
  static canOAuth() {
    return Boolean(SoundcloudOAuth.client_id);
  }

  static get client_id() {
    return env.SOUNDCLOUD_CLIENT_ID;
  }

  static initialise() {
    SC.initialize({
      client_id: SoundcloudOAuth.client_id,
      // hardcoded until soundcloud update the endpoint to https
      redirect_uri: 'https://next.kaiserapps.com/redirect'
    });
  }

  static login() {
    return SC.connect();
  }

  static getTracks() {
    return SC.get('/me/activities/tracks/affiliated');
  }

  static getNextPage(nextHref) {
    const nextUrl = new URL(nextHref);
    const pathname = nextUrl.pathname;
    const options = Object.fromEntries(new URLSearchParams(nextUrl.searchParams));
    return SC.get(pathname, options);
  }
}