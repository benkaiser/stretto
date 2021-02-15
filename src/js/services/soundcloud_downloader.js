const LOCAL_STORAGE_KEY = 'SOUNDCLOUD_CLIENT_ID';
export default class SoundcloudDownloader {
    static getInfo(url, failOnError) {
        return this._resolveInfo(url)
        .then(info => {
            return this._resolveStream(info)
            .then(stream => {
                return {
                    ...info,
                    stream: stream
                };
            });
        })
        .catch((error) => {
            if (failOnError) {
                throw error;
            }
            return this._getClientId(true)
            .then(() => SoundcloudDownloader.getInfo(url, true));
        });
    }

    static _resolveStream(info) {
        return SoundcloudDownloader._getClientId().then(CLIENT_ID => {
            const mpegFormat = info.media.transcodings.filter((transcoding) => transcoding.format.mime_type === "audio/mpeg" && transcoding.format.protocol === "hls")[0];
            return fetch(mpegFormat.url + `?client_id=${CLIENT_ID}`)
            .then(response => response.json())
            .then(json => {
                return {
                    url: json.url,
                    protocol: mpegFormat.format.protocol
                };
            });
        })
    }

    static _resolveInfo(soundcloudUrl) {
        return SoundcloudDownloader._getClientId().then(CLIENT_ID => {
            return fetch(`https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(soundcloudUrl)}&client_id=${CLIENT_ID}`)
            .then(response => response.json());
        });
    }

    static _getClientId(skipCache) {
        if (!skipCache) {
            const localStorageItem = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localStorageItem) {
                return Promise.resolve(localStorageItem);
            }
        }
        return fetch('https://soundcloud.com')
        .then(response => response.text())
        .then(pageText => {
            const scriptUrls = [...pageText.matchAll(/src=\"(.+)\"/g)].map(item => item[1]);
            return SoundcloudDownloader._fetchAllJoin(scriptUrls)
            .then(allScripts => {
                const clientIdStart = allScripts.indexOf('?client_id=') + 11;
                const clientId = allScripts.slice(clientIdStart, clientIdStart + 32);
                localStorage.setItem(LOCAL_STORAGE_KEY, clientId);
                return clientId;
            });
        });
    }

    static _fetchAllJoin(scriptUrls) {
        return Promise.all(scriptUrls.map(scriptUrl => fetch(scriptUrl)))
        .then(responses => Promise.all(responses.map(response => response.text())))
        .then(allScripts => allScripts.join('\n'));
    }
}