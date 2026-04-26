import * as React from 'react';
import Utilities from '../utilities';

import Bootbox from "./bootbox";

const EXTENSION_DETECT_TIMEOUT = 3000;

export default class FirstRunExperience {
  static initialise() {
    if (window.helperExtensionId) {
      return;
    }

    window.onHelperExtensionReady = (extensionId) => {
      window.helperExtensionId = extensionId;
      if (FirstRunExperience._timeout) {
        clearTimeout(FirstRunExperience._timeout);
        FirstRunExperience._timeout = null;
      }
    };

    FirstRunExperience._timeout = setTimeout(() => {
      if (!window.helperExtensionId) {
        FirstRunExperience.showFirstRun();
      }
    }, EXTENSION_DETECT_TIMEOUT);
  }

  static showFirstRun() {
    Bootbox.show(
      <span>Welcome to Stretto</span>,
      <div>
        For Stretto to run correctly, we need a chrome extension installed.
        <ol>
          <li>Download the <a href="https://github.com/benkaiser/Stretto-Helper-Extension/raw/master/extension.zip">extension zip file</a></li>
          { !Utilities.isMobile() && <li>Unzip the file</li> }
          { Utilities.isMobile() ? <li>Navigate to `kiwi://extensions` in your browser</li> : <li>Navigate to `chrome://extensions` in your browser</li> }
          <li>Enable "Developer mode" in the top right corner</li>
          { Utilities.isMobile() ? <li>Click "+ (from zip/...)" and select the extension zip file</li> : <li>Click "Load unpacked" and select the unzipped extension folder</li> }
          <li>Reload Stretto</li>
        </ol>
      </div>
    );
  }
}
