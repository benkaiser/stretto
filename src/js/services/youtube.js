let youtubeIdRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
const resolveIdentity = (i) => Promise.resolve(i);

export default class Youtube {
  static CHANNEL_VIDEOS_PARAMS = 'EgZ2aWRlb3PyBgQKAjoA';

  static extractId(url) {
    let match = url.match(youtubeIdRegex);
    return (match && match[2].length == 11) ? match[2] : false;
  }

  static getInfo(url) {
    let id = Youtube.extractId(url);
    if (!id) {
      return Promise.reject({ error: 'not a youtube track' });
    }
    return fetch(`https://www.youtube.com/watch?v=${id}`)
    .then((response) => response.text())
    .then(Youtube._extractPlayerResponse)
    .then((playerResponse) => {
      try {
        return this._convertVideoPageToStandardTrack(playerResponse);
      } catch (error) {
        console.log('Failed to find youtube info')
        console.error(error);
        return [];
      }
    });
  }

  static isYoutubeURL(url) {
    try {
      url = new URL(url);
      return url.hostname.indexOf('youtu') > -1;
    } catch (error) {
      return false;
    }
  }

  static isChannelUrl(url) {
    if (!Youtube.isYoutubeURL(url)) return false;
    try {
      const path = new URL(url).pathname;
      return /^\/(@[^\/]+|channel\/[^\/]+|c\/[^\/]+|user\/[^\/]+)/.test(path);
    } catch (error) {
      return false;
    }
  }

  static getChannelVideos(channelUrl) {
    const base = channelUrl.replace(/\/+$/, '').replace(/\/(videos|featured|streams|shorts|playlists|about|community)$/, '');
    return fetch(base)
    .then((response) => response.text())
    .then((responseText) => {
      const initialData = Youtube._extractYoutubeHtmlVar('ytInitialData', responseText);
      const ytcfg = Youtube._extractYtcfg(responseText);
      const meta = (initialData.metadata && initialData.metadata.channelMetadataRenderer) || {};
      const header = initialData.header || {};
      const channelId = meta.externalId
        || (header.c4TabbedHeaderRenderer && header.c4TabbedHeaderRenderer.channelId)
        || Youtube._findKey(header, 'channelId');
      const title = meta.title
        || (header.c4TabbedHeaderRenderer && header.c4TabbedHeaderRenderer.title)
        || (header.pageHeaderRenderer && header.pageHeaderRenderer.pageTitle)
        || 'YouTube Channel';
      const apiKey = ytcfg && ytcfg.INNERTUBE_API_KEY;
      const clientVersion = ytcfg && ytcfg.INNERTUBE_CONTEXT && ytcfg.INNERTUBE_CONTEXT.client && ytcfg.INNERTUBE_CONTEXT.client.clientVersion;
      if (!channelId) throw new Error('Could not find channel id');
      return Youtube._browseChannelVideos(channelId, Youtube.CHANNEL_VIDEOS_PARAMS, apiKey, clientVersion)
        .then(({ items, continuation, chips }) => ({
          title, items, continuation, chips, apiKey, clientVersion, channelId
        }));
    });
  }

  static getChannelVideosByChip(chipToken, apiKey, clientVersion) {
    return Youtube.getChannelVideosContinuation(chipToken, apiKey, clientVersion)
      .then(({ items, continuation }) => ({ items, continuation }));
  }

  static _browseChannelVideos(channelId, params, apiKey, clientVersion) {
    return fetch('/youtubei/browse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ browseId: channelId, params, apiKey, clientVersion })
    })
    .then(r => r.json())
    .then(data => {
      window.__lastChannelBrowse = data;
      const tabs = (data.contents && data.contents.twoColumnBrowseResultsRenderer && data.contents.twoColumnBrowseResultsRenderer.tabs) || [];
      const videoTab = tabs.find(t => t.tabRenderer && t.tabRenderer.selected) || tabs.find(t => t.tabRenderer && t.tabRenderer.content && t.tabRenderer.content.richGridRenderer);
      const grid = videoTab && videoTab.tabRenderer && videoTab.tabRenderer.content && videoTab.tabRenderer.content.richGridRenderer;
      if (!grid) return { items: [], continuation: null, chips: [] };
      const chips = Youtube._parseSortChips(grid);
      const { items, continuation } = Youtube._parseRichGridContents(grid.contents);
      return { items, continuation, chips };
    });
  }

  static getChannelVideosContinuation(token, apiKey, clientVersion) {
    return fetch('/youtubei/browse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ continuation: token, apiKey, clientVersion })
    })
    .then(response => response.json())
    .then(data => {
      const actions = (data.onResponseReceivedActions || []).concat(data.onResponseReceivedEndpoints || []);
      let contents = [];
      for (const action of actions) {
        const append = action.appendContinuationItemsAction;
        const reload = action.reloadContinuationItemsCommand;
        if (append && append.continuationItems) contents = contents.concat(append.continuationItems);
        if (reload && reload.continuationItems) contents = contents.concat(reload.continuationItems);
      }
      return Youtube._parseRichGridContents(contents);
    });
  }

  static _parseSortChips(grid) {
    const legacy = [];
    Youtube._collectKey(grid, 'chipCloudChipRenderer', legacy);
    const legacyChips = legacy.map(chip => ({
      label: (chip.text && (chip.text.simpleText || (chip.text.runs && chip.text.runs[0].text))) || '',
      token: chip.navigationEndpoint && chip.navigationEndpoint.continuationCommand && chip.navigationEndpoint.continuationCommand.token,
      selected: !!chip.isSelected
    }));
    const viewModels = [];
    Youtube._collectKey(grid, 'chipViewModel', viewModels);
    const vmChips = viewModels.map(chip => {
      const label = typeof chip.text === 'string'
        ? chip.text
        : (chip.text && (chip.text.content || chip.text.simpleText)) || '';
      const cont = Youtube._findKey(chip, 'continuationCommand');
      const token = cont && cont.token;
      const selected = !!(chip.style && /SELECTED/i.test(chip.style)) || !!chip.isSelected;
      return { label, token, selected };
    });
    return legacyChips.concat(vmChips).filter(chip => chip.token && chip.label);
  }

  static _collectKey(obj, key, out, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 25) return;
    if (obj[key]) out.push(obj[key]);
    for (const k of Object.keys(obj)) {
      if (k === key) continue;
      Youtube._collectKey(obj[k], key, out, depth + 1);
    }
  }

  static _findKey(obj, key, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 8) return null;
    if (obj[key]) return obj[key];
    for (const k of Object.keys(obj)) {
      const found = Youtube._findKey(obj[k], key, depth + 1);
      if (found) return found;
    }
    return null;
  }

  static _parseRichGridContents(contents) {
    let continuation = null;
    const items = [];
    const walk = (entry) => {
      if (!entry || typeof entry !== 'object') return;
      if (entry.richItemRenderer && entry.richItemRenderer.content && entry.richItemRenderer.content.videoRenderer) {
        items.push(Youtube._convertChannelVideoToStandardTrack(entry.richItemRenderer.content.videoRenderer));
        return;
      }
      if (entry.videoRenderer && entry.videoRenderer.videoId) {
        items.push(Youtube._convertChannelVideoToStandardTrack(entry.videoRenderer));
        return;
      }
      if (entry.continuationItemRenderer) {
        const endpoint = entry.continuationItemRenderer.continuationEndpoint;
        if (endpoint && endpoint.continuationCommand && endpoint.continuationCommand.token) {
          continuation = endpoint.continuationCommand.token;
        }
        return;
      }
      if (entry.richSectionRenderer && entry.richSectionRenderer.content) {
        const inner = entry.richSectionRenderer.content;
        if (inner.richShelfRenderer && inner.richShelfRenderer.contents) {
          inner.richShelfRenderer.contents.forEach(walk);
        }
        return;
      }
    };
    (contents || []).forEach(walk);
    return { items, continuation };
  }

  static _parseViews(exact, short) {
    if (exact) {
      const n = parseInt(exact.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(n)) return n;
    }
    if (short) {
      const m = short.match(/([\d.]+)\s*([KMBT])?/i);
      if (m) {
        const base = parseFloat(m[1]);
        const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[(m[2] || '').toUpperCase()] || 1;
        return Math.round(base * mult);
      }
    }
    return 0;
  }

  static _convertChannelVideoToStandardTrack(video) {
    const thumbs = video.thumbnail.thumbnails;
    const title = video.title.runs ? video.title.runs[0].text : video.title.simpleText;
    const channel = (video.ownerText && video.ownerText.runs && video.ownerText.runs[0].text)
      || (video.shortBylineText && video.shortBylineText.runs && video.shortBylineText.runs[0].text)
      || '';
    const duration = video.lengthText ? video.lengthText.simpleText.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0;
    const shortText = video.shortViewCountText && video.shortViewCountText.simpleText;
    const exactText = video.viewCountText && video.viewCountText.simpleText;
    const viewsLabel = shortText ? shortText.replace(/\s*views?$/i, '') : '';
    const views = Youtube._parseViews(exactText, shortText);
    return {
      channel,
      cover: thumbs[thumbs.length - 1].url,
      id: video.videoId,
      isSoundcloud: false,
      isYoutube: true,
      title,
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      duration,
      viewsLabel,
      views
    };
  }

  static _extractYtcfg(responseText) {
    const marker = 'ytcfg.set(';
    let idx = responseText.indexOf(marker);
    while (idx !== -1) {
      const start = idx + marker.length;
      let depth = 0;
      let end = start;
      while (end < responseText.length) {
        const ch = responseText[end];
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) { end++; break; } }
        end++;
      }
      try {
        const obj = JSON.parse(responseText.substring(start, end));
        if (obj && obj.INNERTUBE_API_KEY) return obj;
      } catch (e) {}
      idx = responseText.indexOf(marker, end);
    }
    return null;
  }

  static isPlaylistUrl(url) {
    if (Youtube.isYoutubeURL(url)) {
      try {
        const searchParams = new URL(url).searchParams;
        const video = searchParams.get('v');
        const playlist = searchParams.get('list');
        return video && playlist;
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  }

  static search(query) {
    let capturedApiKey = null;
    let capturedClientVersion = null;
    return fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`YouTube search request failed with status ${response.status} (${response.statusText})`);
      }
      return response.text();
    })
    .then((responseText) => {
      const ytcfg = Youtube._extractYtcfg(responseText);
      if (ytcfg) {
        capturedApiKey = ytcfg.INNERTUBE_API_KEY;
        capturedClientVersion = ytcfg.INNERTUBE_CONTEXT && ytcfg.INNERTUBE_CONTEXT.client && ytcfg.INNERTUBE_CONTEXT.client.clientVersion;
      }
      return Youtube._extractInitialData(responseText);
    })
    .then((parsedJson) => {
      try {
        const sectionList = parsedJson.contents.twoColumnSearchResultsRenderer
          && parsedJson.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer;
        const contents = sectionList
          ? sectionList.contents[0].itemSectionRenderer.contents
          : parsedJson.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;

        const videos = contents.map(item => item.videoRenderer || item.compactVideoRenderer).filter(videoRenderer => !!videoRenderer);
        const items = videos.map(this._convertScrapedSearchResultToCleanTrackInfo);
        let continuation = null;
        if (sectionList && sectionList.contents) {
          const continuationEntry = sectionList.contents.find(c => c.continuationItemRenderer);
          if (continuationEntry) {
            const endpoint = continuationEntry.continuationItemRenderer.continuationEndpoint;
            continuation = endpoint && endpoint.continuationCommand && endpoint.continuationCommand.token;
          }
        }
        items.continuation = continuation;
        items.apiKey = capturedApiKey;
        items.clientVersion = capturedClientVersion;
        return items;
      } catch (error) {
        console.log('Failed to parse youtube search results')
        console.error(error);
        const empty = [];
        empty.continuation = null;
        return empty;
      }
    });
  }

  static searchContinuation(token, apiKey, clientVersion) {
    return fetch('/youtubei/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ continuation: token, apiKey, clientVersion })
    })
    .then(r => r.json())
    .then(data => {
      const actions = (data.onResponseReceivedCommands || [])
        .concat(data.onResponseReceivedActions || [])
        .concat(data.onResponseReceivedEndpoints || []);
      let contents = [];
      for (const action of actions) {
        const append = action.appendContinuationItemsAction;
        const reload = action.reloadContinuationItemsCommand;
        if (append && append.continuationItems) contents = contents.concat(append.continuationItems);
        if (reload && reload.continuationItems) contents = contents.concat(reload.continuationItems);
      }
      let nextContinuation = null;
      const videos = [];
      for (const entry of contents) {
        if (entry.itemSectionRenderer && entry.itemSectionRenderer.contents) {
          for (const inner of entry.itemSectionRenderer.contents) {
            const vr = inner.videoRenderer || inner.compactVideoRenderer;
            if (vr) videos.push(vr);
          }
        } else if (entry.continuationItemRenderer) {
          const endpoint = entry.continuationItemRenderer.continuationEndpoint;
          if (endpoint && endpoint.continuationCommand) nextContinuation = endpoint.continuationCommand.token;
        }
      }
      const items = videos.map(Youtube._convertScrapedSearchResultToCleanTrackInfo);
      items.continuation = nextContinuation;
      return items;
    });
  }

  static getPlaylistAnonymous(videoId, playlistId) {
    if (playlistId && playlistId.indexOf('RD') === 0) {
      return fetch(this._getPlaylistVideoUrl(videoId, playlistId))
      .then((response) => response.text())
      .then(Youtube._extractInitialData).then(parsedJson => {
        const playlist = parsedJson.contents.twoColumnWatchNextResults.playlist.playlist;
        const items = playlist.contents.map(item => item.playlistPanelVideoRenderer);
        return {
          title: playlist.title,
          items: this._guessSplitTitle(items.map(this._convertScrapedPlaylistItemToStandardTrack))
        };
      });
    }
    return fetch('/youtubei/browse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ browseId: 'VL' + playlistId })
    })
    .then(r => r.json())
    .then(data => {
      const title = (data.metadata && data.metadata.playlistMetadataRenderer && data.metadata.playlistMetadataRenderer.title)
        || Youtube._findKey(data, 'title') && Youtube._findKey(data, 'title').simpleText
        || 'YouTube Playlist';
      const videoRenderers = [];
      Youtube._collectKey(data, 'playlistVideoRenderer', videoRenderers);
      return {
        title,
        items: Youtube._guessSplitTitle(videoRenderers.map(Youtube._convertPlaylistVideoRendererToStandardTrack))
      };
    });
  }

  static _convertPlaylistVideoRendererToStandardTrack(v) {
    const thumbs = v.thumbnail.thumbnails;
    const title = v.title.runs ? v.title.runs[0].text : v.title.simpleText;
    const bylineRun = v.shortBylineText && v.shortBylineText.runs && v.shortBylineText.runs[0];
    const channel = (bylineRun && bylineRun.text) || '';
    const canonicalBaseUrl = bylineRun && bylineRun.navigationEndpoint && bylineRun.navigationEndpoint.browseEndpoint && bylineRun.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
    const channelUrl = canonicalBaseUrl ? `https://www.youtube.com${canonicalBaseUrl}` : '';
    const duration = v.lengthText ? v.lengthText.simpleText.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0;
    let viewsLabel = '';
    if (v.videoInfo && v.videoInfo.runs) {
      const viewsRun = v.videoInfo.runs.find(r => /views?/i.test(r.text));
      if (viewsRun) viewsLabel = viewsRun.text.replace(/\s*views?$/i, '');
    }
    const views = Youtube._parseViews(null, viewsLabel);
    return {
      channel,
      cover: thumbs[thumbs.length - 1].url,
      id: v.videoId,
      isSoundcloud: false,
      isYoutube: true,
      title,
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      duration,
      viewsLabel,
      views,
      channelUrl
    };
  }

  static _convertScrapedPlaylistItemToStandardTrack(track) {
    let viewsLabel = '';
    if (track.videoInfo && track.videoInfo.runs) {
      const viewsRun = track.videoInfo.runs.find(r => /views?/i.test(r.text));
      if (viewsRun) viewsLabel = viewsRun.text.replace(/\s*views?$/i, '');
    }
    const views = Youtube._parseViews(null, viewsLabel);
    return {
      channel: track.shortBylineText.runs[0].text,
      cover: track.thumbnail.thumbnails[track.thumbnail.thumbnails.length-1].url,
      id: track.videoId,
      isSoundcloud: false,
      isYoutube: true,
      title: track.title.simpleText,
      url: `https://www.youtube.com/watch?v=${track.videoId}`,
      duration: track.lengthText.simpleText.split(':').reduce((acc,time) => (60 * acc) + +time),
      viewsLabel,
      views
    };
  }

  // specifically not a standard track, keeping title and channel intact
  static _convertScrapedSearchResultToCleanTrackInfo(track) {
    return {
      channel: track.longBylineText.runs[0].text,
      thumbnail: track.thumbnail.thumbnails[track.thumbnail.thumbnails.length-1].url,
      id: track.videoId,
      isSoundcloud: false,
      isYoutube: true,
      title: track.title.runs ? track.title.runs[0].text : track.title.simpleText,
      url: `https://www.youtube.com/watch?v=${track.videoId}`,
      duration: track.lengthText ? track.lengthText.simpleText.split(':').reduce((acc,time) => (60 * acc) + +time) : 0
    };
  }

  static _convertVideoPageToStandardTrack(playerResponse) {
    const thumbnails = playerResponse.videoDetails.thumbnail.thumbnails;
    const id = playerResponse.videoDetails.videoId;
    return {
      channel: playerResponse.videoDetails.author,
      thumbnail: thumbnails[thumbnails.length-1].url,
      id: id,
      isSoundcloud: false,
      isYoutube: true,
      title: playerResponse.videoDetails.title,
      url: `https://www.youtube.com/watch?v=${id}`,
      duration: Number(playerResponse.videoDetails.lengthSeconds)
    };
  }

  static _extractInitialData(responseText) {
    const ytInitialData = Youtube._extractYoutubeHtmlVar('ytInitialData', responseText);
    if (ytInitialData) {
      return ytInitialData;
    }
    throw new Error('Unable to extract initial data');
  }

  static _extractPlayerResponse(responseText) {
    const ytInitialPlayerResponse = Youtube._extractYoutubeHtmlVar('ytInitialPlayerResponse', responseText);
    if (ytInitialPlayerResponse) {
      return ytInitialPlayerResponse;
    }
    throw new Error('Unable to extract initial data');
  }

  static _extractYoutubeHtmlVar(varName, responseText) {
    let varMarker = responseText.indexOf(`var ${varName}`);
    if (varMarker === -1) {
      varMarker = responseText.indexOf(`window["${varName}"]`)
    }
    const startScriptMarker = responseText.substr(0, varMarker).lastIndexOf('>') + 1;
    const endScriptMarker = responseText.substr(startScriptMarker).indexOf('</script>');
    const scriptContents = responseText.substr(startScriptMarker, endScriptMarker);
    const varData = eval(scriptContents + `;window["${varName}"]||` + varName);
    if (varData) {
      return varData;
    }
  }

  // gets the first video id to create a radio URL
  static _getPlaylistVideoUrl(videoId, playlistId) {
    return `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&start_radio=1`;
  }

  static _guessSplitTitle(items) {
    return items.map((item) => {
      const youtubeTitle = item.title;
      const dashIndex = youtubeTitle.indexOf('-');
      if (dashIndex > -1) {
        item.title = youtubeTitle.substr(dashIndex + 1).trim();
        item.artist = youtubeTitle.substr(0, dashIndex).trim();
      } else {
        item.artist = item.channel;
      }
      return item;
    });
  }
}

window.YoutubeService = Youtube;