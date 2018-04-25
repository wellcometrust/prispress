import htmlparser from 'htmlparser2'

const prismicBlocksMap = {
  h2: 'heading2',
  p: 'paragraph',
  ul: 'list-item',
  ol: 'o-list-item',
}

const prismicSpansMap = {
  a: 'hyperlink',
  i: 'em',
  em: 'em',
  b: 'strong',
  strong: 'strong'
}

const reduceNodeChildrenToText = (children) => {
  return children.reduce((text, child) => {
    if (child.type === 'text') {
      return `${text}${child.data}`;
    } else {
      return text + reduceNodeChildrenToText(child.children)
    }
  }, '')
}

const flattenBlock = (block, nodes) => {
  return nodes.reduce((block, node) => {
    if (node.type === 'text') {
      const newBlock = {
        type: block.type,
        content: {
          text: `${block.content.text}${node.data}`,
          spans: block.content.spans
        }
      }

      return newBlock
    } else {
      // Create other converters
      const data = node.name === 'a' ? {
        link_type: 'Web',
        url: node.attribs.href
      } : {}
      const fullText = reduceNodeChildrenToText(node.children)
      const span = {
        start: block.content.text.length,
        // This feels like it could live in this reduce function,
        // just not sure how
        end: block.content.text.length + fullText.length,
        type: prismicSpansMap[node.name],
        data: data
      }

      const newBlock = {
        type: block.type,
        content: {
          text: block.content.text,
          spans: block.content.spans.concat([span])
        }
      }
      if (!node.children) {console.info(node)}
      return flattenBlock(newBlock, node.children)
    }
  }, block)
}

function cleanCrappyDrupalHtml(string) {
  string = string.trim()
  string = string.replace(/\s\s+/g, ' ')
  string = string.replace(new RegExp('<br /><br />', 'g'), '</p><p>')
  string = string.replace(/<p><strong>([^<\/].*)<\/strong><\/p>/g, '<h2>$1</h2>')
  string = string.replace(/\n/g, '')
  string = string.replace(/\t/g, '')
  return string
}

export function convertHtmlStringToPrismicStructure(string) {
  // let's do some boring string manipultion first
  const cleanString = cleanCrappyDrupalHtml(string)
  const elements = htmlparser.parseDOM(cleanString)

  const prismicStructure = convertElements(elements)

  return prismicStructure
}

function convertElements(elements) {
  const blockArrays = elements.map(node => {
    if (prismicBlocksMap[node.name]) {
      const type = prismicBlocksMap[node.name];
      // List items need to be converted to parent elements
      // This is not nice.
      if (type === 'o-list-item' || type === 'list-item') {
        const flattenedBlocks = node.children.map(listItemNode => {
          // We should turn this into a parent recursor, but that's for later
          // This is just whitespace between list items
          if (listItemNode.type === 'text') return

          return flattenBlock({
            type,
            content: {
              spans: [],
              text: ''
            }
          }, listItemNode.children)
        }).filter(Boolean)

        return flattenedBlocks
      }

      const block = {
        type,
        content: {
          spans: [],
          text: ''
        }
      }
      const flattenedBlock = flattenBlock(block, node.children)
      return [flattenedBlock];
    } else {
      // if we have text, convert it to a p, unless it's an empty text
      if (node.data.trim() === '') {
        return
      } else {
        const block = {
          type: 'paragraph',
          content: {
            spans: [],
            text: node.data.trim()
          }
        }
        return [block];
      }
    }
  }).filter(Boolean)

  // This should be a self-referencing function, but I have no time
  return [].concat(...blockArrays)
}

export function convertImgHtmlToImage(html) {
  const img = htmlparser.parseDOM(html)[0]

  return {
    contentUrl: img.attribs.src,
    width: img.attribs.width,
    height: img.attribs.height,
    alt: img.attribs.alt,
  }
}
