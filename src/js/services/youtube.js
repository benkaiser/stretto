let youtubeIdRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
const resolveIdentity = (i) => Promise.resolve(i);

export default class Youtube {
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
    return fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`)
    .then((response) => response.text())
    .then(Youtube._extractInitialData)
    .then((parsedJson) => {
      try {
        const contents = parsedJson.contents.twoColumnSearchResultsRenderer
          ? parsedJson.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents
          : parsedJson.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;


        const videos = contents.map(item => item.videoRenderer || item.compactVideoRenderer).filter(videoRenderer => !!videoRenderer);
        return videos.map(this._convertScrapedSearchResultToCleanTrackInfo);
      } catch (error) {
        console.log('Failed to parse youtube search results')
        console.error(error);
        return [];
      }
    });
  }

  static getPlaylistAnonymous(videoId, playlistId) {
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

  static _convertScrapedPlaylistItemToStandardTrack(track) {
    return {
      channel: track.shortBylineText.runs[0].text,
      cover: track.thumbnail.thumbnails[track.thumbnail.thumbnails.length-1].url,
      id: track.videoId,
      isSoundcloud: false,
      isYoutube: true,
      title: track.title.simpleText,
      url: `https://www.youtube.com/watch?v=${track.videoId}`,
      duration: track.lengthText.simpleText.split(':').reduce((acc,time) => (60 * acc) + +time)
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