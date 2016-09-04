import * as React from "react";

import '../../scss/components/content_container.scss';

export class ContentContainer extends React.Component<{}, {}> {
  render() {
    return <div className="custom-scrollbar page-wrapper" tabIndex="0">
    </div>;
  }
}
