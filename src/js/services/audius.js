import Utilities from "../utilities";

export default class Audius {
  static async getInfo(url) {
    const endpoint = await this.getAudiusAPIEndpoint();
    return fetch(`${endpoint}/v1/resolve?url=${encodeURIComponent(url)}&app_name=benkaiser/stretto`)
    .then(Utilities.fetchToJson)
    .then(info => {
      const data = info.data;
      return {
        thumbnail: data.artwork['1000x1000'],
        id: data.id,
        isAudius: true,
        title: data.title,
        artist: data.user.name,
        url: url,
        duration: Number(data.duration)
      };
    });
  }

  static async getSong(id) {
    const endpoint = await this.getAudiusAPIEndpoint();
    return `https://creatornode2.audius.co/tracks/stream/${id}`;
  }

  static isAudiusURL(url) {
    try {
      url = new URL(url);
      return url.hostname.includes('audius.co');
    } catch (error) {
      return false;
    }
  }

  static getAudiusAPIEndpoint() {
    return Promise.resolve('https://discoveryprovider.audius.co');
  }
}

window.AudiusService = Audius;