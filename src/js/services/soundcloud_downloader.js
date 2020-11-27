const SOUNDCLOUD_CLIENT_ID = 'dNhNOtdLfZ4zaPqT9a9wzk8nf57qNQDh';
export default class SoundcloudDownloader {
    static getInfo(url) {
        return this._resolveInfo(url)
        .then(info => {
            return this._resolveStream(info)
            .then(stream => {
                return {
                    ...info,
                    stream: stream
                };
            });
        });
    }

    static _resolveStream(info) {
        const mpegFormat = info.media.transcodings.filter((transcoding) => transcoding.format.mime_type === "audio/mpeg" && transcoding.format.protocol === "hls")[0];
        return fetch(mpegFormat.url + `?client_id=${SOUNDCLOUD_CLIENT_ID}`)
        .then(response => response.json())
        .then(json => {
            return {
                url: json.url,
                protocol: mpegFormat.format.protocol
            };
        });
    }

    static _resolveInfo(soundcloudUrl) {
        return fetch(`https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(soundcloudUrl)}&client_id=${SOUNDCLOUD_CLIENT_ID}`)
        .then(response => response.json());
    }
}