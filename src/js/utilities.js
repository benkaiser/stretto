const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;

export default class Utilities {
  static fetchToJson(response) {
    return response.json();
  }

  // modified from: https://stackoverflow.com/a/11486026/485048
  static timeFormat(seconds) {
    let hrs = ~~(seconds / 3600);
    let mins = ~~((seconds % 3600) / 60);
    let secs = seconds % 60;
    let ret = "";
    if (hrs > 0) {
        ret += `${hrs}:${(mins < 10 ? "0" : "")}`;
    }
    ret += `${mins}:${(secs < 10 ? "0" : "")}${secs}`;
    return ret;
  }
}
