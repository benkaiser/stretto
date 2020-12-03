import * as React from 'react';

import Bootbox from "./bootbox";

export default class FirstRunExperience {
  static initialise() {
    if (FirstRunExperience.checkExtensions()) {
      FirstRunExperience.showFirstRun();
    }
  }

  static showFirstRun() {
    Bootbox.show(
      <span>Welcome to Stretto</span>,
      <div>
        For Stretto to run correctly, we need a chrome extension installed.
        <ol>
          <li>Download this <a href="https://github.com/benkaiser/Stretto-Helper-Extension/raw/master/extension.zip">chrome extension zip file</a></li>
          <li>Unzip the file</li>
          <li>Navigate to `chrome://extensions` in your browser</li>
          <li>Enable "Developer mode" in the top right corner</li>
          <li>Click "Load unpacked" and select the unzipped extension folder</li>
          <li>Reload this page</li>
        </ol>
      </div>
    );
  }

  static checkExtensions() {
    try {
      return !window.helperExtensionId;
    } catch (_) {
      return true;
    }
  }
}