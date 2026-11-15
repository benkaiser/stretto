
const LOCAL_STORAGE_KEY = 'SOUNDCLOUD_CLIENT_ID';
export default class SoundcloudDownloader {
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