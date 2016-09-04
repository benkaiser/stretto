import * as React from "react";

import "../../scss/components/sidebar_view.scss";

export default class SidebarView extends React.Component<{}, {}> {
  render() {
    return <div className="sidebar-view" tabIndex="0">
      <h3>Sidebar</h3>
    </div>;
  }
}
