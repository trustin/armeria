import React from 'react';

interface MaxWidthProps {
  value: number | string;
}

const MaxWidth: React.FC<MaxWidthProps> = props => (
  <div
    style={{ maxWidth: props.value, marginLeft: 'auto', marginRight: 'auto' }}
  >
    {props.children}
  </div>
);

export default MaxWidth;
