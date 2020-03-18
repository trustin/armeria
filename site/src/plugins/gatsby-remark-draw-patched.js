const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/* eslint-disable import/no-extraneous-dependencies */
// Installed by gatsby-remark-draw
const urljoin = require('url-join');
const visit = require('unist-util-visit');
/* eslint-enable import/no-extraneous-dependencies */

const Draw = require('gatsby-remark-draw/lib/draw');

const DEPLOY_DIR = 'public';

module.exports = ({ markdownAST, pathPrefix }, pluginOptions = {}) => {
  visit(markdownAST, 'code', (node, index, parent) => {
    const draw = new Draw();
    const lang = node.lang || '';

    if (!draw.isValidLanguage(lang)) {
      return;
    }

    if (pluginOptions.strategy === 'img') {
      const svg = draw
        .render(lang, node.value, pluginOptions)
        .value.replace(
          /(<style[^>]*>)/,
          "$1\n@import url('https://cdn.jsdelivr.net/npm/hack-font@3.3.0/build/web/hack-subset.css');\n",
        );

      if (!svg.includes('hack-subset.css')) {
        throw new Error(`Failed to inject the font CSS: ${svg}`);
      }

      const hash = crypto
        .createHmac('sha1', 'gatsby-remark-draw')
        .update(svg)
        .digest('hex');
      const fileName = `${hash}.svg`;
      const fullPath = path.join(DEPLOY_DIR, fileName);
      fs.writeFileSync(fullPath, svg);

      const image = {
        type: 'html',
        value: `<span class="${draw.className} ${
          draw.className
        }-${lang}"><img src="${urljoin('/', pathPrefix, fileName)}" /></span>`,
      };

      parent.children.splice(index, 1, image);
    } else {
      throw new Error(`strategy must be 'img': ${pluginOptions.strategy}`);
    }
  });

  return markdownAST;
};
