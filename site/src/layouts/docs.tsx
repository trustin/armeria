import {
  CloseOutlined,
  GithubOutlined,
  LeftOutlined,
  RightOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { MDXProvider } from '@mdx-js/react';
import { History, HistoryLocation } from '@reach/router';
import { Button, Layout, Select } from 'antd';
import { graphql, Link, navigate, useStaticQuery, withPrefix } from 'gatsby';
import { OutboundLink } from 'gatsby-plugin-google-analytics';
import React from 'react';
import StickyBox from 'react-sticky-box';
import tocbot from 'tocbot';

import 'antd/es/table/style';

import { Tip, Warning } from '../components/alert';
import { TypeLink } from '../components/api-link';
import CodeBlock from '../components/code-block';
import MaxWidth from '../components/max-width';
import NoWrap from '../components/nowrap';
import BaseLayout from './base';
import styles from './docs.module.less';

import docsIndex from '../pages/docs/index.json';

const { Content } = Layout;

interface DocsLayoutProps {
  history: History;
  location: HistoryLocation;
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
      <div className="ant-table ant-table-small ant-table-bordered">
        <div className="ant-table-container">
          <div className="ant-table-content">
            <table {...props} />
          </div>
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
  tfoot: (props: any) => {
    return <tfoot className="ant-table-tfoot" {...props} />;
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
  MaxWidth,
  NoWrap,
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
          tableOfContents(maxDepth: 1)
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

  React.useLayoutEffect(() => {
    tocbot.init({
      tocSelector: `.${styles.pageToc}`,
      contentSelector: `.${styles.content}`,
      headingSelector: 'h1, h2, h3, h4',
    });

    return () => {
      tocbot.destroy();
    };
  }, []);

  // Create a map of page name and MDX node pair, while adding the 'href' property.
  const nameToMdxNode: { [name: string]: any } = {};
  candidateMdxNodes.forEach((mdxNode: any) => {
    if (
      mdxNode.parent.sourceInstanceName === 'docs' &&
      mdxNode.tableOfContents.items.length > 0
    ) {
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
  const mdxNodes: any[] = [];
  const groupToMdxNodes: { [group: string]: any[] } = {};
  let prevMdxNode: any;
  Object.entries(docsIndex).forEach(([group, groupIndex]) => {
    for (let i = 0; i < groupIndex.length; i += 1) {
      const name = groupIndex[i];
      const mdxNode = nameToMdxNode[name];
      if (mdxNode) {
        mdxNodes.push(mdxNode);

        // Group MDX nodes by its group.
        const groupedMdxNodes = groupToMdxNodes[group];
        if (groupedMdxNodes) {
          groupedMdxNodes.push(mdxNode);
        } else {
          groupToMdxNodes[group] = [mdxNode];
        }

        if (prevMdxNode) {
          // Note: Do not refer to 'prevMdxNode' or 'mdxNode' directly here,
          //       to avoid creating cyclic references.
          mdxNode.prevNodeName = prevMdxNode.parent.name;
          prevMdxNode.nextNodeName = name;
        }
        prevMdxNode = mdxNode;
      }
    }
  });

  const currentMdxNode = findCurrentMdxNode();
  const pageTitle = `${
    currentMdxNode !== mdxNodes[0]
      ? `${currentMdxNode.tableOfContents.items[0].title} - `
      : ''
  }Armeria documentation`;

  const [tocState, setTocState] = React.useState(ToCState.CLOSED);
  const tocStateRef = React.useRef(tocState);
  tocStateRef.current = tocState;

  const showSearch = typeof window === 'undefined' || window.innerWidth > 768;

  function findCurrentMdxNode(): any {
    const path = props.location.pathname;
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

    for (let i = 0; i < mdxNodes.length; i += 1) {
      const e = mdxNodes[i];
      if (pageName === e.parent.name) {
        return e;
      }
    }

    return mdxNodes[0];
  }

  function toggleToC() {
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

  // Style functions for fading in/out table of contents.
  function pageTocWrapperStyle(): React.CSSProperties {
    switch (tocState) {
      case ToCState.OPENING:
        return {
          display: 'block',
          opacity: 0,
          zIndex: 8,
        };
      case ToCState.OPEN:
        return {
          display: 'block',
          opacity: 1,
          zIndex: 8,
        };
      case ToCState.CLOSING:
        return {
          display: 'block',
          opacity: 0,
          zIndex: 8,
        };
      default:
        return { zIndex: 'auto' };
    }
  }

  return (
    <MDXProvider components={mdxComponents}>
      <BaseLayout
        pageTitle={pageTitle}
        history={props.history}
        location={props.location}
      >
        <div className={styles.wrapper}>
          <div className={styles.globalTocWrapper}>
            <nav>
              <ol>
                {Object.entries(groupToMdxNodes).map(
                  ([group, groupedMdxNodes]) => {
                    function renderMdxNodes() {
                      return groupedMdxNodes.flatMap(mdxNode => {
                        return mdxNode.tableOfContents.items.map(
                          (tocItem: any, i: number) => {
                            const href = `${mdxNode.href}${
                              i !== 0 ? tocItem.url : ''
                            }`;
                            return (
                              <li key={href}>
                                <Link to={href}>
                                  {tocItem !==
                                  mdxNodes[0].tableOfContents.items[0]
                                    ? tocItem.title
                                    : 'Home'}
                                </Link>
                              </li>
                            );
                          },
                        );
                      });
                    }

                    if (group === 'root') {
                      return [
                        ...renderMdxNodes(),
                        <li key="group-references" className={styles.tocGroup}>
                          <span className={styles.tocGroupLabel}>
                            REFERENCES
                          </span>
                          <ol>
                            <li>
                              <OutboundLink href="https://github.com/line/armeria/releases">
                                Release notes
                              </OutboundLink>
                            </li>
                            <li>
                              <OutboundLink href="https://javadoc.io/doc/com.linecorp.armeria/armeria-javadoc">
                                API documentation
                              </OutboundLink>
                            </li>
                          </ol>
                        </li>,
                      ];
                    }

                    return (
                      <li key={`group-${group}`} className={styles.tocGroup}>
                        <span className={styles.tocGroupLabel}>
                          {group.toUpperCase()}
                        </span>
                        <ol>{renderMdxNodes()}</ol>
                      </li>
                    );
                  },
                )}
              </ol>
            </nav>
          </div>
          <div className={styles.content}>
            <Content className="ant-typography" role="main">
              {props.children}
              <div className={styles.footer}>
                <div className={styles.editOnGitHub}>
                  <OutboundLink href={currentMdxNode.githubHref}>
                    <GithubOutlined /> Edit on GitHub
                  </OutboundLink>
                </div>
                {currentMdxNode.prevNodeName ? (
                  <Link
                    className={styles.prevButton}
                    to={nameToMdxNode[currentMdxNode.prevNodeName].href}
                  >
                    <Button>
                      <LeftOutlined />{' '}
                      {
                        nameToMdxNode[currentMdxNode.prevNodeName]
                          .tableOfContents.items[0].title
                      }
                    </Button>
                  </Link>
                ) : (
                  ''
                )}
                {currentMdxNode.nextNodeName ? (
                  <Link
                    className={styles.nextButton}
                    to={nameToMdxNode[currentMdxNode.nextNodeName].href}
                  >
                    <Button>
                      <RightOutlined />
                      {
                        nameToMdxNode[currentMdxNode.nextNodeName]
                          .tableOfContents.items[0].title
                      }{' '}
                    </Button>
                  </Link>
                ) : (
                  ''
                )}
              </div>
            </Content>
          </div>
          <div className={styles.tocButton}>
            <StickyBox offsetTop={24} offsetBottom={24}>
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
            className={styles.pageTocWrapper}
            style={pageTocWrapperStyle()}
            role="directory"
          >
            <StickyBox
              offsetTop={24}
              offsetBottom={24}
              className={styles.pageTocShadow}
            >
              <nav>
                <div className={styles.pageToc} />
                <Select
                  showSearch={showSearch}
                  placeholder="Jump to other page"
                  onChange={href => {
                    navigate(`${href}`);
                  }}
                  filterOption={(input, option) =>
                    option.children
                      ?.toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {Object.entries(groupToMdxNodes).map(
                    ([group, groupedMdxNodes]) => {
                      function renderMdxNodes() {
                        return groupedMdxNodes.map(mdxNode => (
                          <Select.Option
                            key={mdxNode.href}
                            value={mdxNode.href}
                          >
                            {mdxNode !== mdxNodes[0]
                              ? mdxNode.tableOfContents.items[0].title
                              : 'Home'}
                          </Select.Option>
                        ));
                      }

                      if (group === 'root') {
                        return renderMdxNodes();
                      }

                      return (
                        <Select.OptGroup
                          key={`group-${group}`}
                          label={group.toUpperCase()}
                        >
                          {renderMdxNodes()}
                        </Select.OptGroup>
                      );
                    },
                  )}
                </Select>
              </nav>
            </StickyBox>
          </div>
        </div>
      </BaseLayout>
    </MDXProvider>
  );
};

export default DocsLayout;
