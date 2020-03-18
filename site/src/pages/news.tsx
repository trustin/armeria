import { History, HistoryLocation } from '@reach/router';
import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import { Button } from 'antd';
import BaseLayout from '../layouts/base';

const NewsPage: React.FC<{
  history?: History;
  location: HistoryLocation;
}> = props => {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  return (
    <BaseLayout {...props}>
      <div>
        <h1>Hi people</h1>
        <p>
          Welcome to your new <strong>{site.siteMetadata.title}</strong> site.
        </p>
        <p>Now go build something great.</p>
      </div>
      <Button>Hello</Button>
    </BaseLayout>
  );
};

export default NewsPage;
