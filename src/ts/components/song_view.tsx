import * as React from "react";

import "../../scss/components/song_view.scss";

export default class SongView extends React.Component<{}, {}> {
  render() {
    let cells = new Array();
    for (let x = 0; x < 1000; x++) {
      cells.push(<tr><td>Test</td></tr>);
    }

    return <div className="song-view custom-scrollbar">
      <h1>Library</h1>
      <table>
      { cells }
      </table>
    </div>;
  }
}
