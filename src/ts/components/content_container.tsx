import * as React from "react";
import SidebarView from "./sidebar_view";
import FooterView from "./footer_view";

import "../../scss/components/content_container.scss";


export default class ContentContainer extends React.Component<{}, {}> {
  render() {
    return <div className="content-container" tabIndex="0">
      <div className="content-container-body">
        <SidebarView />
        { this.props.children }
      </div>
      <FooterView />
    </div>;
  }
}
