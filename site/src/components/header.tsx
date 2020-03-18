import { HistoryLocation } from '@reach/router';
import { Layout, Menu } from 'antd';
import Link from 'gatsby-link';
import React from 'react';
import Logo from './logo';

import styles from './header.module.less';

const { Header } = Layout;

interface HeaderComponentProps {
  location: HistoryLocation;
}

const selectableKeysAndRegexes = {
  news: /\/news(\/|$)/,
  guides: /\/guides(\/|$)/,
  docs: /\/docs(\/|$)/,
  community: /\/community(\/|$)/,
  home: /.?/,
};

const HeaderComponent: React.FC<HeaderComponentProps> = props => {
  const selectedKeyAndRegex = Object.entries(
    selectableKeysAndRegexes,
  ).find(([, regexp]) => props.location?.pathname?.match(regexp));

  const selectedKeys = selectedKeyAndRegex ? [selectedKeyAndRegex[0]] : [];

  return (
    <div className={styles.wrapper}>
      <Header className={styles.header}>
        <Link to="/" title="Home">
          <Logo
            className={styles.logo}
            role="navigation"
            label="Home"
            textColor="#ffffff"
          />
        </Link>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={selectedKeys}
          className={styles.menu}
        >
          <Menu.Item key="news">
            <Link to="/news">News</Link>
          </Menu.Item>
          <Menu.Item key="docs">
            <Link to="/docs">Documentation</Link>
          </Menu.Item>
          <Menu.Item key="community">
            <Link to="/community">Community</Link>
          </Menu.Item>
        </Menu>
      </Header>
    </div>
  );
};

export default HeaderComponent;
