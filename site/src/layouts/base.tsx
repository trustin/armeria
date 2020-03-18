import { History, HistoryLocation } from '@reach/router';
import GitHubCorners from '@uiw/react-github-corners';
import { BackTop, Layout } from 'antd';
import { graphql, useStaticQuery } from 'gatsby';
import React from 'react';
import CookieConsent from 'react-cookie-consent';
import { Helmet } from 'react-helmet';
// @ts-ignore
import configReveal from 'react-reveal/globals';

import Header from '../components/header';
import Footer from '../components/footer';

import styles from './base.module.less';
import jumpToHash from './jump-to-hash';

const { Content } = Layout;

configReveal({ ssrFadeout: true });

interface BaseLayoutProps {
  history?: History;
  location: HistoryLocation;
  pageTitle?: string;
}

const BaseLayout: React.FC<BaseLayoutProps> = props => {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setLoaded(true);
    // Scroll to the anchor if necessary.
    jumpToHash(props.location.hash);
  }, [props.location]);

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
    <>
      <Helmet title={props.pageTitle || site.siteMetadata.title} />
      <BackTop />
      <span className={styles.githubCorners}>
        <GitHubCorners
          href="https://github.com/line/armeria"
          position="right"
          bgColor="#3a3a3a"
          zIndex={9999}
          fixed
        />
      </span>
      <Layout
        className={styles.layout}
        style={loaded ? {} : { overflowX: 'hidden' }}
      >
        <Header location={props.location} />
        <Content className={styles.content}>{props.children}</Content>
        <Footer />
      </Layout>
      <CookieConsent
        declineButtonText="Opt out"
        buttonClasses={styles.cookieConsentAcceptButton}
        declineButtonClasses={styles.cookieConsentDeclineButton}
        enableDeclineButton
        disableButtonStyles
        acceptOnScroll
        onDecline={() =>
          props.history?.navigate('https://tools.google.com/dlpage/gaoptout/')
        }
      >
        This website uses anonymous cookies to ensure we provide you the best
        experience.
      </CookieConsent>
    </>
  );
};

export default BaseLayout;
