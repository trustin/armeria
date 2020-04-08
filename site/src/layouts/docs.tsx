import {
  CloseOutlined,
  DownOutlined,
  GithubOutlined,
  LeftOutlined,
  RightOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { MDXProvider } from '@mdx-js/react';
import { History, HistoryLocation } from '@reach/router';
import { Button, Divider, Input, Layout, Tree } from 'antd';
import { graphql, Link, navigate, useStaticQuery, withPrefix } from 'gatsby';
import { OutboundLink } from 'gatsby-plugin-google-analytics';
import React from 'react';
import StickyBox from 'react-sticky-box';

import 'antd/es/table/style';

import { Tip, Warning } from '../components/alert';
import { TypeLink } from '../components/api-link';
import CodeBlock from '../components/code-block';
import BaseLayout from './base';
import styles from './docs.module.less';
import jumpToHash from './jump-to-hash';

import docsIndex from '../pages/docs/index.json';

const { Content } = Layout;
const { Search } = Input;

interface DocsLayoutProps {
  history: History;
  location: HistoryLocation;
  pageTitle?: string;
}

interface ToCItem {
  key: string;
  className: string;
  href: string;
  title: string;
  pageTitle: string;
  pageName: string;
  hash: string;
  mdxNode: any;
  children: ToCItem[];
}

enum ToCState {
  CLOSED,
  OPENING,
  OPEN,
  CLOSING,
}

const tocAnimationDurationMillis = 300;
const pathPrefix = withPrefix('/');

// Use our CodeBlock component for <a> and <pre>.
const mdxComponents: any = {
  a: (props: any) => {
    const href: string = `${props.href || ''}`;
    if (href.startsWith('type://')) {
      return (
        <TypeLink to={href.substring(7)}>
          {props.children !== href ? props.children : ''}
        </TypeLink>
      );
    }
    if (href.startsWith('typeplural://')) {
      return (
        <TypeLink to={href.substring(13)} plural>
          {props.children !== href ? props.children : ''}
        </TypeLink>
      );
    }

    if (href.includes('://') || href.startsWith('//')) {
      return <OutboundLink {...props} />;
    }

    if (href.startsWith(pathPrefix)) {
      // Strip the path prefix when passing to <Link />
      // because it will prepend the path prefix.
      return (
        <Link
          to={props.href.substring(pathPrefix.length - 1)}
          className={props.className}
        >
          {props.children}
        </Link>
      );
    }

    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return <a {...props} />;
  },
  pre: (props: any) => {
    const language =
      props.children.props.className?.replace(/language-/, '') || 'none';
    return (
      <CodeBlock language={language}>{props.children.props.children}</CodeBlock>
    );
  },
  table: (props: any) => {
    return (
      <div className="ant-table ant-table-bordered ant-table-small">
        <div className="ant-table-content">
          <table {...props} style={{ tableLayout: 'auto' }} />
        </div>
      </div>
    );
  },
  thead: (props: any) => {
    return <thead className="ant-table-thead" {...props} />;
  },
  tbody: (props: any) => {
    return <tbody className="ant-table-tbody" {...props} />;
  },
  th: (props: any) => {
    return <th className="ant-table-cell" {...filterTableCellProps(props)} />;
  },
  td: (props: any) => {
    return <td className="ant-table-cell" {...filterTableCellProps(props)} />;
  },
  Tip,
  Warning,
  CodeBlock,
  TypeLink,
};

function filterTableCellProps(props: any) {
  const newProps = {
    ...props,
    rowSpan: props.rowspan,
    colSpan: props.colspan,
  };
  if (props.align) {
    if (newProps.style) {
      newProps.style = { ...newProps.style, textAlign: props.align };
    } else {
      newProps.style = { textAlign: props.align };
    }
  }

  delete newProps.align;
  delete newProps.rowspan;
  delete newProps.colspan;
  return newProps;
}

const DocsLayout: React.FC<DocsLayoutProps> = props => {
  const {
    allMdx: { nodes: candidateMdxNodes },
  } = useStaticQuery(graphql`
    query {
      allMdx {
        nodes {
          tableOfContents
          parent {
            ... on File {
              sourceInstanceName
              name
            }
          }
        }
      }
    }
  `);

  // Create a map of page name and MDX node pair, while adding the 'href' property.
  const nameToMdxNode: { [name: string]: any } = {};
  candidateMdxNodes.forEach((mdxNode: any) => {
    if (mdxNode.parent.sourceInstanceName === 'docs') {
      /* eslint-disable no-param-reassign */
      mdxNode.href = `/docs${
        mdxNode.parent.name === 'index' ? '' : `/${mdxNode.parent.name}`
      }`;
      mdxNode.githubHref = `https://github.com/line/armeria/tree/master/site/src/pages/docs/${mdxNode.parent.name}.mdx`;
      /* eslint-enable no-param-reassign */
      nameToMdxNode[mdxNode.parent.name] = mdxNode;
    }
  });

  // Create a list of MDX pages, ordered as specified in 'docs/index.json'.
  const items: ToCItem[] = [];
  let prevMdxNode: any;
  for (let i = 0; i < docsIndex.length; i += 1) {
    const name = docsIndex[i];
    const mdxNode = nameToMdxNode[name];
    if (mdxNode) {
      newItems(mdxNode).forEach(item => items.push(item));
      if (prevMdxNode) {
        // Note: Do not refer to 'prevMdxNode' or 'mdxNode' directly here,
        //       to avoid creating cyclic references.
        mdxNode.prevNodeName = prevMdxNode.parent.name;
        prevMdxNode.nextNodeName = name;
      }
      prevMdxNode = mdxNode;
    }
  }

  const currentItem = findCurrentItem(items, props.location);
  const [selectedItemKeys, setSelectedItemKeys] = React.useState([
    currentItem.key,
  ]);
  const [expandedItemKeys, setExpandedItemKeys] = React.useState(
    // Expand all items initially.
    // Pass [currentItem] to expand only the current item.
    initialExpandedItemKeys(items),
  );
  const [autoExpandParent, setAutoExpandParent] = React.useState(true);

  const [tocState, setTocState] = React.useState(ToCState.CLOSED);
  const tocStateRef = React.useRef(tocState);
  tocStateRef.current = tocState;

  const [, setSearchValue] = React.useState('');

  function onSearch(event: React.ChangeEvent<HTMLInputElement>) {
    const searchText = event.target.value.trim().toLowerCase();
    const result =
      searchText.length !== 0
        ? findExpandedItemKeys(searchText, items)
        : [currentItem.key];
    setAutoExpandParent(true);
    setExpandedItemKeys(result);
    setSelectedItemKeys(result);
  }

  function onClick(event: React.MouseEvent, treeNode: any) {
    // Close the Table of Contents if necessary.
    if (tocState === ToCState.OPEN) {
      setTocState(ToCState.CLOSING);
      setTimeout(() => {
        if (tocStateRef.current === ToCState.CLOSING) {
          setTocState(ToCState.CLOSED);
        }
      }, tocAnimationDurationMillis);
    }

    const item = treeNode as ToCItem;
    // Use 'navigate' only when there's actual page transition.
    if (item.pageName !== currentItem.pageName) {
      navigate(item.href);
    } else {
      // Update the ToC tree state.
      if (!expandedItemKeys.find(key => key === item.key)) {
        setExpandedItemKeys([...expandedItemKeys, item.key]);
      }
      setSelectedItemKeys([item.key]);

      // Scroll down to the anchor.
      jumpToHash(item.hash);
    }
  }

  function onExpand(expandedKeys: string[]) {
    setAutoExpandParent(false);
    setExpandedItemKeys(expandedKeys);
  }

  function toggleToC() {
    setSearchValue('');
    switch (tocState) {
      case ToCState.CLOSED:
        setTocState(ToCState.OPENING);
        setTimeout(() => {
          if (tocStateRef.current === ToCState.OPENING) {
            setTocState(ToCState.OPEN);
          }
        });
        break;
      case ToCState.OPEN:
        setTocState(ToCState.CLOSING);
        setTimeout(() => {
          if (tocStateRef.current === ToCState.CLOSING) {
            setTocState(ToCState.CLOSED);
          }
        }, tocAnimationDurationMillis);
        break;
      default:
      // Animation in progress. Let the user wait a little bit.
    }
  }

  // Style functions for responsive table of contents.
  const [viewportWidth, setViewportWidth] = React.useState(window.innerWidth);
  React.useLayoutEffect(() => {
    function updateViewportWidth() {
      setViewportWidth(window.innerWidth);
    }
    window.addEventListener('resize', updateViewportWidth);
    updateViewportWidth();
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  function wrapperStyle(): React.CSSProperties {
    if (isLargeDisplay()) {
      return {
        display: 'flex',
        alignItems: 'stretch',
        margin: '16px auto',
        maxWidth: '1200px',
      };
    }

    return {
      position: 'relative',
    };
  }

  function tocButtonStyle(): React.CSSProperties {
    if (isLargeDisplay()) {
      return {
        display: 'none',
      };
    }

    return {
      position: 'absolute',
      zIndex: 200,
      top: 0,
      right: 0,
      left: 'calc(100% - 80px)',
      bottom: 0,
      margin: '16px',
      textAlign: 'right',
    };
  }

  function tocWrapperStyle(): React.CSSProperties {
    if (isLargeDisplay()) {
      return {
        flexBasis: '256px',
        flexGrow: 0,
        flexShrink: 0,
        background: 'white',
      };
    }

    const style: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      zIndex: 100,
      transitionProperty: 'opacity',
      transitionDuration: `${tocAnimationDurationMillis}ms`,
    };

    switch (tocState) {
      case ToCState.OPENING:
        style.display = '';
        style.opacity = 0;
        break;
      case ToCState.OPEN:
        style.display = '';
        style.opacity = 1;
        break;
      case ToCState.CLOSING:
        style.display = '';
        style.opacity = 0;
        break;
      default:
        style.display = 'none';
        style.opacity = 0;
        break;
    }
    return style;
  }

  function tocShadowStyle(): React.CSSProperties {
    if (isLargeDisplay()) {
      return {};
    }

    return {
      // From @box-shadow-base:
      boxShadow:
        '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    };
  }

  function contentStyle(): React.CSSProperties {
    if (isLargeDisplay()) {
      const tocPanelWidth = 256 + 16;
      return {
        flexGrow: 1,
        marginLeft: '16px',
        width: viewportWidth >= 1200 ? `${1200 - tocPanelWidth}px` : undefined,
        maxWidth:
          viewportWidth >= 1200
            ? `${1200 - tocPanelWidth}px`
            : `calc(100vw - ${tocPanelWidth}px)`,
        minHeight: 'calc(100vh - 64px - 112px - 32px)',
      };
    }

    return {};
  }

  function isLargeDisplay() {
    return viewportWidth >= 768;
  }

  return (
    <MDXProvider components={mdxComponents}>
      <BaseLayout
        pageTitle={`${currentItem.pageTitle} — Armeria documentation`}
        history={props.history}
        location={props.location}
      >
        <div className={styles.wrapper} style={wrapperStyle()}>
          <div className={styles.tocButton} style={tocButtonStyle()}>
            <StickyBox offsetTop={16} offsetBottom={16}>
              <Button onClick={toggleToC}>
                {tocState === ToCState.OPEN ? (
                  <CloseOutlined title="Close table of contents" />
                ) : (
                  <UnorderedListOutlined title="Open table of contents" />
                )}
              </Button>
            </StickyBox>
          </div>
          <div
            className={styles.tocWrapper}
            style={tocWrapperStyle()}
            role="directory"
          >
            <StickyBox offsetTop={0} offsetBottom={16} style={tocShadowStyle()}>
              <div className={styles.tocInnerWrapper}>
                <div className={styles.toc}>
                  <Search
                    placeholder="Search table of contents"
                    onChange={onSearch}
                    allowClear
                  />
                  <Tree
                    className={styles.tocTree}
                    treeData={items}
                    selectedKeys={selectedItemKeys}
                    expandedKeys={expandedItemKeys}
                    autoExpandParent={autoExpandParent}
                    multiple
                    onClick={onClick}
                    onExpand={onExpand}
                    switcherIcon={<DownOutlined />}
                  />
                </div>
              </div>
            </StickyBox>
          </div>
          <div className={styles.content} style={contentStyle()}>
            <Content className="ant-typography" role="main">
              {props.children}
              <div className={styles.footer}>
                <div className={styles.editOnGitHub}>
                  <OutboundLink href={currentItem.mdxNode.githubHref}>
                    <GithubOutlined /> Edit on GitHub
                  </OutboundLink>
                </div>
                <Divider />
                {currentItem.mdxNode.prevNodeName
                  ? renderButton(
                      nameToMdxNode[currentItem.mdxNode.prevNodeName],
                      styles.prevButton,
                      <>
                        <LeftOutlined /> Prev
                      </>,
                    )
                  : []}
                {currentItem.mdxNode.nextNodeName
                  ? renderButton(
                      nameToMdxNode[currentItem.mdxNode.nextNodeName],
                      styles.nextButton,
                      <>
                        Next <RightOutlined />
                      </>,
                    )
                  : []}
              </div>
            </Content>
          </div>
        </div>
      </BaseLayout>
    </MDXProvider>
  );
};

function newItems(
  mdxNode: any,
  mdxTableOfContents?: any,
  depth?: number,
): ToCItem[] {
  const mdxToC = mdxTableOfContents || mdxNode.tableOfContents;
  if (!mdxToC || !mdxToC.items || mdxToC.items.length <= 0) {
    return [];
  }

  const currentDepth = depth || 1;

  return mdxToC.items.map((item: any) => {
    return {
      key: `${mdxNode.parent.name}${item.url}`,
      className: styles[`tocDepth${currentDepth}`],
      href: `${mdxNode.href}${item.url}`,
      title: item.title,
      pageTitle: mdxNode.tableOfContents.items[0].title,
      pageName: mdxNode.parent.name,
      hash: item.url,
      mdxNode,
      children: newItems(mdxNode, item, currentDepth + 1),
    };
  });
}

function findCurrentItem(
  items: ToCItem[],
  location: HistoryLocation,
): ToCItem | undefined {
  const path = location.pathname;
  const prefix = '/docs';
  const prefixPos = path.indexOf(prefix);

  const fallbackPageName = 'index';
  let pageName: string | undefined;
  if (prefixPos < 0) {
    pageName = fallbackPageName;
  } else {
    const pathWithoutPrefix = path.substring(prefixPos + prefix.length);
    if (pathWithoutPrefix === '' || pathWithoutPrefix === '/') {
      pageName = fallbackPageName;
    } else {
      pageName = pathWithoutPrefix.substring(1);
      if (pageName.endsWith('/')) {
        pageName = pageName.substring(0, pageName.length - 1);
      }
    }
  }

  let bestMatch: ToCItem | undefined;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (pageName !== item.mdxNode.parent.name) {
      continue;
    }

    if (item.href.endsWith(location.hash)) {
      bestMatch = item;
      break;
    }

    const found = findCurrentItem(item.children, location);
    if (found) {
      bestMatch = found;
      break;
    }

    if (!bestMatch) {
      bestMatch = item;
    }
  }

  return bestMatch || items[0];
}

function initialExpandedItemKeys(items: ToCItem[], result?: string[]) {
  const firstCall = result === undefined;
  const collected = result || [];

  const maxNumExpandedItems = Number.MAX_SAFE_INTEGER;

  items.forEach(item => {
    // Expand up to 2 items so that a visitor is not overwhelmed.
    if (
      collected.length < maxNumExpandedItems &&
      (firstCall || item.children.length > 0)
    ) {
      collected.push(item.key);
      initialExpandedItemKeys(item.children, collected);
    }
  });

  return collected;
}

function findExpandedItemKeys(searchText: string, items: ToCItem[]): string[] {
  return items.flatMap(item => {
    if (item.title.toLowerCase().indexOf(searchText) >= 0) {
      return [item.key];
    }
    // Search recursively.
    return findExpandedItemKeys(searchText, item.children);
  });
}

function renderButton(node: any, className: string, children: React.ReactNode) {
  return (
    <Link className={className} to={node.href}>
      <Button>{children}</Button>
    </Link>
  );
}

export default DocsLayout;
