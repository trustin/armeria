import { Layout, Typography } from 'antd';
import { OutboundLink } from 'gatsby-plugin-google-analytics';
import React from 'react';
import Logo from './logo';
import Mailchimp from './mailchimp';

import styles from './footer.module.less';

const { Paragraph } = Typography;
const { Footer } = Layout;

export default () => {
  return (
    <div className={styles.footerWrapper}>
      <Footer className={styles.footer}>
        <div className={styles.newsletterForm}>
          <Paragraph>Sign up for our newsletters:</Paragraph>
          <Mailchimp
            url="https://github.us19.list-manage.com/subscribe/post?u=3447f8227584634e6ee046edf&id=852d70ccdc"
            botCode="b_3447f8227584634e6ee046edf_852d70ccdc"
          />
        </div>
        <div className={styles.copyright}>
          <div>
            &copy; 2015-2020, LINE Corporation
            <br />
            <OutboundLink href="https://terms.line.me/line_rules?lang=en">
              Privacy policy
            </OutboundLink>
          </div>
          <div>
            <Logo
              notext
              width="4rem"
              primaryColor="rgba(255, 255, 255, 1.0)"
              secondaryColor="rgba(255, 255, 255, 0.55)"
              tertiaryColor="transparent"
            />
          </div>
        </div>
      </Footer>
    </div>
  );
};
