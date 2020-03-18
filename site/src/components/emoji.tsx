import React from 'react';

import style from './emoji.module.less';

interface EmojiProps {
  emoji: string;
  label: string;
}

const Emoji: React.FC<EmojiProps> = props => (
  <span role="img" aria-label={props.label} className={style.emoji}>
    {props.emoji}
  </span>
);

export default Emoji;
