import { Typography } from 'antd';
import React from 'react';

import styles from './blockquote.module.less';

const { Title, Paragraph } = Typography;

interface BlockquoteProps {
  author: React.ReactNode;
  from: React.ReactNode;
  bgColor1: string;
  bgColor2: string;
}

const Blockquote: React.FC<BlockquoteProps> = props => (
  <blockquote className={styles.blockquote}>
    <Paragraph
      className={styles.body}
      style={{ backgroundColor: props.bgColor1 }}
    >
      {props.children}
      <span className={styles.quote} style={{ borderColor: props.bgColor2 }} />
    </Paragraph>
    <Title level={4} className={styles.author}>
      <span className={styles.separator}>&mdash; </span>
      {props.author}
      <br />
      <span className={styles.from}>{props.from}</span>
    </Title>
  </blockquote>
);

export default Blockquote;
