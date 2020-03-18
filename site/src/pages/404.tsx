import { History, HistoryLocation } from '@reach/router';
import { Typography } from 'antd';
import React from 'react';

import BaseLayout from '../layouts/base';

const NotFound: React.FC<{
  history?: History;
  location: HistoryLocation;
}> = props => (
  <BaseLayout {...props} pageTitle="Not found">
    <Typography.Title level={1}>Not found</Typography.Title>
  </BaseLayout>
);

export default NotFound;
