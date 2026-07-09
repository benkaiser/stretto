import Hls from 'hls.js/dist/hls.light';
import Utilities from '../utilities';

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
            return this.getClientId(true)
            .then(() => SoundcloudDownloader.getInfo(url, true));
        });
    }

    static download(song) {
        const audioBuffer = [];
        const player = document.createElement('audio');
        player.volume = 0;
        SoundcloudDownloader.getInfo(song.url)
        .then(info => info.stream.url)
        .then(hlsurl => {
            var hls = new Hls({
                maxBufferLength: 60,
                maxMaxBufferLength: 60 * 3,
                startPosition: 0
            });
            hls.attachMedia(player);
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(hlsurl);
                hls.on(Hls.Events.FRAG_BUFFERED, (_, data) => {
                    console.log(`Download progress: ${Math.round(data.frag.endPTS / player.duration * 100)}%`);
                    player.currentTime = data.frag.endPTS;
                });
                hls.on(Hls.Events.BUFFER_APPENDING, (_, data) => {
                    audioBuffer.push(data.data);
                });
                hls.on(Hls.Events.BUFFER_EOS, () => {
                    console.log('Made available for offline');
                    song.cacheOffline(Utilities.arrayConcat(audioBuffer));
                });
            });
        });
    }

    static _resolveStream(info) {
        return SoundcloudDownloader.getClientId().then(CLIENT_ID => {
            const mpegFormat = info.media.transcodings.filter((transcoding) => transcoding.format.mime_type === "audio/mpeg" && transcoding.format.protocol === "hls")[0];
            let url = mpegFormat.url + `?client_id=${CLIENT_ID}`;
            if (info.track_authorization && info.track_authorization !== '******') {
                url += `&track_authorization=${encodeURIComponent(info.track_authorization)}`;
            }
            return SoundcloudDownloader._helperFetchText(url)
            .then(text => JSON.parse(text))
            .then(json => {
                return {
                    url: json.url,
                    protocol: mpegFormat.format.protocol
                };
            });
        })
    }

    static _resolveInfo(soundcloudUrl) {
        return SoundcloudDownloader.getClientId().then(CLIENT_ID => {
            return SoundcloudDownloader._helperFetchText(`https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(soundcloudUrl)}&client_id=${CLIENT_ID}`)
            .then(text => JSON.parse(text));
        });
    }

    // Proxy a GET through the Stretto Helper Chrome extension when available.
    // The extension's background service worker performs the fetch with
    // `credentials: 'include'`, which attaches the user's real soundcloud.com
    // cookies (including Datadome) so the response contains an un-masked
    // `track_authorization` — required to stream AD_SUPPORTED tracks.
    // Falls back to a direct fetch when the extension is not installed.
    static _helperFetchText(url) {
        const extId = typeof window !== 'undefined' && window.helperExtensionId;
        const chromeApi = typeof chrome !== 'undefined' ? chrome : null;
        if (!extId || !chromeApi || !chromeApi.runtime || !chromeApi.runtime.sendMessage) {
            return fetch(url).then(response => response.text());
        }
        return new Promise((resolve, reject) => {
            let settled = false;
            const fallback = (reason) => {
                if (settled) return;
                settled = true;
                console.warn('SoundCloud helper proxy fell back to direct fetch:', reason);
                fetch(url).then(response => response.text()).then(resolve, reject);
            };
            try {
                chromeApi.runtime.sendMessage(extId, {
                    type: 'proxy-fetch',
                    url,
                    method: 'GET',
                    headers: { 'Accept': 'application/json, text/plain, */*' }
                }, (res) => {
                    if (settled) return;
                    if (chromeApi.runtime.lastError || !res) {
                        return fallback(chromeApi.runtime.lastError && chromeApi.runtime.lastError.message);
                    }
                    if (!res.ok) {
                        return fallback(`status ${res.status}`);
                    }
                    settled = true;
                    resolve(res.body);
                });
            } catch (e) {
                fallback(e && e.message);
            }
        });
    }

    static getClientId(skipCache) {
        if (!skipCache) {
            const localStorageItem = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localStorageItem) {
                return Promise.resolve(localStorageItem);
            }
        }
        return fetch('https://soundcloud.com')
        .then(response => response.text())
        .then(pageText => {
            const scriptUrls = [...matchAll("src=\"(.+)\"", pageText)].map(item => item[1]);
            return SoundcloudDownloader._fetchAllJoin(scriptUrls)
            .then(allScripts => {
                const clientId = allScripts.match(/client_id\:\"([a-zA-Z0-9]{32})\"/)[1];
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

function matchAll(pattern,haystack){
    var regex = new RegExp(pattern,"g")
    var matches = [];

    var match_result = haystack.match(regex);

    for (let index in match_result){
        var item = match_result[index];
        matches[index] = item.match(new RegExp(pattern));
    }
    return matches;
}