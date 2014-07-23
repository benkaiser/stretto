path = require('path');
// export json of config
exports.config = function(){
  data = {
    // edit below here
    music_dir: "/home/benkaiser/Music/"
    // and above here
    ignore: [
      /(\/|^)\./ // ignore dot files and folders
    ]
  }
  data.music_dir = path.normalize(data.music_dir);
  if(data.music_dir.lastIndexOf("/") == data.music_dir.length-1){
    data.music_dir = data.music_dir.substr(0, data.music_dir.length-1);
  }
  return data;
}
