import { OutboundLink } from 'gatsby-plugin-google-analytics';
import React from 'react';

import styles from './api-link.module.less';

import nameToHrefId from '../../gen-src/api-index/name-to-href-id.json';
import hrefs from '../../gen-src/api-index/hrefs.json';

interface TypeLinkProps {
  to: string;
  plural?: boolean;
}

const TypeLink: React.FC<TypeLinkProps> = props => {
  const isAnnotation = props.to.startsWith('@');
  const typeName = isAnnotation ? props.to.substring(1) : props.to;
  const hrefId: number | undefined = (nameToHrefId as {
    [name: string]: number;
  })[typeName];
  const href = hrefId ? hrefs[hrefId] : undefined;

  // Use the children as they are if the caller specified children.
  // Otherwise, use the simple class name with optional plural suffix.
  if (!props.children) {
    let simpleTypeName = typeName;
    const lastDotIdx = simpleTypeName.lastIndexOf('.');
    if (lastDotIdx >= 0) {
      simpleTypeName = simpleTypeName.substring(lastDotIdx + 1);
    }

    let suffix = '';
    if (props.plural) {
      if (props.to.match(/(ch|s|sh|x|z)$/)) {
        suffix = 'es';
      } else {
        suffix = 's';
      }
    }

    const label = (
      <code>
        {isAnnotation ? '@' : ''}
        {simpleTypeName}
      </code>
    );

    if (href) {
      return (
        <span className={styles.apiLink}>
          <OutboundLink href={href}>{label}</OutboundLink>
          {suffix}
        </span>
      );
    }

    return (
      <span className={styles.apiLink}>
        {label}
        {suffix}
      </span>
    );
  }

  if (href) {
    return <OutboundLink href={href}>{props.children}</OutboundLink>;
  }

  return <>{props.children}</>;
};

export { TypeLink };
