const path = require('path');
const remarkGridTablesPlugin = require('remark-grid-tables');

module.exports = {
  siteMetadata: {
    title: 'Armeria web site',
    siteUrl: 'https://line.github.io/',
    slackInviteUrl:
      'https://join.slack.com/t/line-armeria/shared_invite/enQtNjIxNDU1ODU1MTI2LWRlMGRjMzIwOTIzMzA2NDA1NGMwMTg2MTA3MzE4MDYyMjUxMjRlNWRiZTc1N2Q3ZGRjNDA5ZDZhZTI1NGEwODk',
  },
  pathPrefix: '/armeria/',
  plugins: [
    {
      resolve: 'gatsby-plugin-google-analytics',
      options: {
        trackingId: 'UA-145425527-1',
      },
    },
    {
      resolve: 'gatsby-plugin-import',
      options: {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
      },
    },
    {
      resolve: 'gatsby-plugin-less',
      options: {
        javascriptEnabled: true,
        modifyVars: {
          hack: `true; @import '${path.resolve(
            __dirname,
            'src',
            'styles',
            'antd-overrides.less',
          )}';`,
        },
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'Armeria',
        short_name: 'Armeria',
        start_url: '/',
        lang: 'en',
        display: 'browser',
        icon: 'src/images/favicon.svg',
      },
    },
    {
      resolve: 'gatsby-plugin-mdx',
      options: {
        defaultLayouts: {
          default: path.resolve(__dirname, 'src', 'layouts', 'base.tsx'),
          docs: path.resolve(__dirname, 'src', 'layouts', 'docs.tsx'),
        },
        remarkPlugins: [remarkGridTablesPlugin],
        gatsbyRemarkPlugins: [
          'gatsby-remark-autolink-headers',
          {
            resolve: require.resolve(
              path.resolve(
                __dirname,
                'src',
                'plugins',
                'gatsby-remark-draw-patched',
              ),
            ),
            options: {
              strategy: 'img',
              mermaid: {
                theme: 'neutral',
                backgroundColor: 'transparent',
              },
            },
          },
          {
            resolve: 'gatsby-remark-images',
            options: {
              linkImagesToOriginal: false,
            },
          },
        ],
      },
    },
    'gatsby-plugin-sharp',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-typescript',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: 'community',
        path: path.resolve(__dirname, 'src', 'pages', 'community'),
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: 'docs',
        path: path.resolve(__dirname, 'src', 'pages', 'docs'),
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: 'images',
        path: path.resolve(__dirname, 'src', 'images'),
      },
    },
    'gatsby-transformer-sharp',
  ],
};
