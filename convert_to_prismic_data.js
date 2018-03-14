#!/usr/bin/env node
const html2json = require('html2json').html2json;
const prismicTypeMap = {
  p: 'paragraph',
  a: 'hyperlink',
  em: 'em'
};

const testText = `
This is what the text will look like.
`.trim();

const testHtml = `
<p>This is what <a href="https://google.com">the <em>text</em> will</a> look like.</p>
`.trim();

const testPrismicData = [{
  type: 'paragraph',
  text: 'This is what the text will look like.',
  spans: [{
    start: 13,
    end: 26,
    type: 'hyperlink',
    data: {
      link_type: 'Web',
      url: 'https://google.com'
    }
  }, {
    start: 17,
    end: 21,
    type: 'em'
  }]
}];

const testJson = {
  node: 'root',
  child: [
    {
      node: 'element',
      tag: 'p',
      child: [
        {
          node: 'text',
          text: 'This is what '
        },
        {
          node: 'element',
          tag: 'a',
          attr: { href: 'https://google.com' },
          child: [
            {
              node: 'text',
              text: 'the '
            },
            {
              node: 'element',
              tag: 'em',
              child: [
                {
                  node: 'text',
                  text: 'text'
                }
              ]
            },
            {
              node: 'text',
              text: ' will'
            }
          ]
        },
        {
          node: 'text',
          text: ' look like.'
        }
      ]
    }
  ]
};

var nonConverts = [];

function convert(elArray, pointer = 0) {
  return elArray.reduce((acc, el) => {
    if (el.node === 'text') {
      const text = `${acc.text}${el.text}`;
      pointer = pointer + text.length;
      return {
        type: acc.type,
        text,
        spans: acc.spans
      };
    } else if (el.child) {
      const isFirst = pointer === 0;
      if (isFirst) {
        acc.type = prismicTypeMap[el.tag];
      }
      const span = {
        type: prismicTypeMap[el.tag],
        start: pointer
      };
      const domStructure = convert(el.child, pointer);
      pointer = pointer + domStructure.text.length;
      span.end = pointer;
      const newDomStructure = {
        type: acc.type,
        text: `${acc.text}${domStructure.text}`,
        spans: [isFirst ? null : span].concat(domStructure.spans).filter(_ => _)
      };
      return newDomStructure;
    } else if (
      // Empty tags
      (!el.child && (
        el.tag === 'p' ||
        el.tag === 'strong' ||
        el.tag === 'br' ||
        el.tag === 'h4' ||
        el.tag === 'em' ||
        el.tag === 'i' ||
        el.tag === 'span'
      )) ||
      el.node === 'comment'
    ) {
      return acc;
    } else {
      if (el.tag === 'iframe') { console.info(el.attr.src) }
      nonConverts.push(el);
      return acc;
    }
  }, { text: '', spans: [] });
}

export function convertHtmlToPrismicData(html) {
  try {
    nonConverts = [];
    const json = html2json(html);
    const converts = convert(json.child);
    return { converts, nonConverts };
  } catch (e) {
    console.info(`Error: Cannot convert ${html}`);
    return null;
  }
}
