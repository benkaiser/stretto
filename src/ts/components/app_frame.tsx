import * as React from "react";

import ContentContainer from "./content_container";
import Navigation from "./navigation";

export default class AppFrame extends React.Component<any, any> {
    render() {
        return <div>
          <Navigation />
          <ContentContainer children={this.props.children} />
        </div>;
    }
}
