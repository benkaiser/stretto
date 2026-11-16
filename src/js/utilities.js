import { downloadZip } from 'client-zip';

const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;

export default class Utilities {
  static fetchToJson(response) {
    return response.json();
  }

  static fetchToText(response) {
    return response.text();
  }

  static fetchToCSV(response) {
    return response.text().then(text => {
      return text.split('\n').map(line => {
        if (line === '') {
          return undefined;
        }
        return (line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []).map(cell => {
          return cell.replace(/(^"|"$)/g, '');
        });
      }).filter(item => item !== undefined);
    });
  }

  // modified from: https://stackoverflow.com/a/11486026/485048
  static timeFormat(seconds) {
    let hrs = ~~(seconds / 3600);
    let mins = ~~((seconds % 3600) / 60);
    let secs = seconds % 60;
    let ret = '';
    if (hrs > 0) {
        ret += `${hrs}:${(mins < 10 ? '0' : '')}`;
    }
    ret += `${mins}:${(secs < 10 ? '0' : '')}${secs}`;
    return ret;
  }

  static generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(Array(length)).map(() => possible.charAt(Math.floor(Math.random() * possible.length))).join('');
  }

  static getHashParams(hash) {
    let hashParams = {};
    let e, r = /([^&;=]+)=?([^&;]*)/g, q = hash;
    while (e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  static isMobile() {
    if (screen.orientation) {
      return screen.orientation.type.includes('portrait') && window.innerWidth < 700;
    }
    return window.innerWidth < 700;
  }

  static debounce(func) {
    var timer;
    return function(event){
      if(timer) clearTimeout(timer);
      timer = setTimeout(func,100,event);
    };
  }

  static arrayConcat(inputArray) {
    const totalLength = inputArray.reduce(function (prev, cur) {
      return prev + cur.length;
    }, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    inputArray.forEach(function (element) {
      result.set(element, offset);
      offset += element.length;
    });
    return result;
  }

  static downloadFiles(items) {
    var link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    Promise.all(items.map(item =>
      fetch(item.url).then(response => response.blob()).then(blob => [item, blob])
    ))
    .then(blobItems => {
      blobItems.forEach(([item, blob]) => {
        link.setAttribute('href', window.URL.createObjectURL(blob));
        link.setAttribute('download', item.filename);
        link.click();
      });
    })
    .then(() => {
      document.body.removeChild(link);
    });
  }

  // Bundles files into one uncompressed zip (audio is already compressed). On browsers with the File System
  // Access API the zip streams straight to disk, otherwise it's assembled in memory as a single Blob.
  static async downloadZip(items, zipName, onProgress) {
    let handle;
    if (window.showSaveFilePicker) {
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: zipName,
          types: [{ description: 'Zip archive', accept: { 'application/zip': ['.zip'] } }]
        });
      } catch (error) {
        if (error.name === 'AbortError') return false;
      }
    }
    const usedNames = new Set();
    const uniqueName = (filename) => {
      const clean = filename.replace(/[\\/:*?"<>|]/g, '_');
      const dot = clean.lastIndexOf('.');
      const base = dot > 0 ? clean.slice(0, dot) : clean;
      const extension = dot > 0 ? clean.slice(dot) : '';
      let name = clean;
      for (let n = 2; usedNames.has(name); n++) {
        name = `${base} (${n})${extension}`;
      }
      usedNames.add(name);
      return name;
    };
    async function* entries() {
      for (let i = 0; i < items.length; i++) {
        const response = await fetch(items[i].url);
        if (response.ok) {
          yield { name: uniqueName(items[i].filename), lastModified: new Date(), input: await response.blob() };
        }
        onProgress && onProgress(i + 1, items.length);
      }
    }
    const zipResponse = downloadZip(entries());
    if (handle) {
      await zipResponse.body.pipeTo(await handle.createWritable());
    } else {
      const url = window.URL.createObjectURL(await zipResponse.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    }
    return true;
  }
}
