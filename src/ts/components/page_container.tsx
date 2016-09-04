import * as React from 'react';
import { ContentContainer } from './content_container';
import { Navigation } from './navigation';


import '../../scss/components/page_container.scss';

export class PageContainer extends React.Component<{}, {}> {
  render() {
    return <div>
      <Navigation />
      <ContentContainer />
    </div>;
  }
}
