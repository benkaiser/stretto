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
    return `${endpoint}/v1/tracks/${id}/stream?app_name=benkaiser/stretto`;
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
    if (this._cachedAudiusEndpoint) {
      return Promise.resolve(this._cachedAudiusEndpoint);
    }
    return fetch('https://api.audius.co')
    .then(Utilities.fetchToJson)
    .then(response => {
      this._cachedAudiusEndpoint = response.data[0];
      return this._cachedAudiusEndpoint;
    })
  }
}

window.AudiusService = Audius;