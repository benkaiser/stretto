var platformLookup = {
  mac: 'darwin',
  linux: 'linux',
  windows: 'win32',
};

var architectureLookup = {
  32: 'ia32',
  64: 'x64',
};

$(document).ready(function () {
  var latestRelease = 'https://github.com/benkaiser/stretto/releases/download/v0.0.6/Stretto-';
  var os;

  if (platform.os.family == 'Linux') {
    // if it's linux, follow this format
    latestRelease += platformLookup[platform.os.family.toLowerCase()];
    os = 'Linux';
  } else if (platform.os.family.toLowerCase().indexOf('windows') >= 0) {
    latestRelease += platformLookup.windows;
    os = 'Windows';
  } else if (platform.os.family == 'OS X') {
    latestRelease += platformLookup.mac;
    os = 'macOS';
  } else {
    return;
  }

  latestRelease += '-' + architectureLookup[platform.os.architecture] + '.zip';

  $('.download-main').html('Download for ' + os);
  $('.download-main').attr('href', latestRelease);
});
