import * as React from "react";
import { Link } from "react-router";

import "../../scss/components/navigation.scss";

export default class Navigation extends React.Component<{}, {}> {
  render() {
    return <nav className="navbar navbar-default navbar-fixed-top" role="navigation">
      <div className="navbar-header">
        <Link className="navbar-brand" to={`/`}>Stretto</Link>
        <button className="navbar-toggle" type="button" data-toggle="collapse" data-target="#navbar-main">
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
      </div>
      <div className="navbar-collapse collapse" id="navbar-main">
        <ul className="nav navbar-nav">
          <li className="dropdown">
            <a className="pointer dropdown-toggle" data-toggle="dropdown">Scan Library <span className="caret"></span></a>
            <ul className="dropdown-menu" role="menu">
              <li><a className="pointer" id="soft_scan">Regular Scan</a></li>
              <li><a className="pointer" id="hard_scan">Hard Rescan</a></li>
            </ul>
          </li>
          <li><Link className="pointer" to={"sync"}>Sync Libraries</Link></li>
        </ul>
        <ul className="nav navbar-nav pull-right">
          <li className="dropdown">
            <a className="pointer dropdown-toggle" data-toggle="dropdown">Fetch New Music <span className="caret"></span></a>
            <ul className="dropdown-menu" role="menu">
              <li><a className="pointer" id="soundcloud_fetch">From SoundCloud</a></li>
              <li><a className="pointer" id="youtube_fetch">From Youtube</a></li>
            </ul>
          </li>
          <li><a id="open_settings" className="pointer"><i className="fa fa-cog"></i> Settings</a></li>
        </ul>
      </div>
    </nav>;
  }
}
