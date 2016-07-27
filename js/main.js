$(document).ready(function() {
  var latestRelease = 'https://github.com/benkaiser/stretto/releases/download/v0.0.5/Stretto-';
  var os;

  if (platform.os.family == 'Linux') {
    // if it's linux, follow this format
    latestRelease += platform.os.family.toLowerCase() + '-' + platform.os.architecture + 'bit';
    os = 'Linux';
  } else if (platform.os.family.toLowerCase().indexOf('windows') >= 0) {
    latestRelease += 'windows-' + platform.os.architecture + 'bit';
    os = 'Windows';
  } else if (platform.os.family == 'OS X') {
    latestRelease += 'mac';
    os = 'Mac OS X';
  } else {
    return;
  }

  latestRelease += '.zip';

  $('.download-main').html('Download for ' + os);
  $('.download-main').attr('href', latestRelease);
});
