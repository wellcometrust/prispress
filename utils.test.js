import {convertHtmlStringToPrismicStructure} from './utils'

/*
  The structure of the Prismic content is like this:
  [{
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
*/
test('converts body correctly', async () => {
  const html = `
    <p>
      If you would like to get in touch with us to ask any more questions or
      discuss any accessibility requirements, please email
      <a href="mailto:TheHub@wellcomecollection.org">TheHub@wellcomecollection.org</a>
    </p>
    <h2>Things that happen</h2>
    <p>This is unlikely, <strong>but <em>definitely possible</em> and annoying</strong></p>
    <ul>
      <li>Things</li>
      <li>Hello <em>There</em> stranger</li>
    </ul>
  `
  const body = await convertHtmlStringToPrismicStructure(html)

  // Test single spans and link data
  expect(body.length).toBe(5)
  expect(body[0].content.spans[0].start).toBe(125)
  expect(body[0].content.spans[0].end).toBe(154)
  expect(body[0].content.spans[0].data.url).toBe('mailto:TheHub@wellcomecollection.org')

  // Test generic parsing
  expect(body[1].content.text).toBe('Things that happen')
  expect(body[1].type).toBe('heading2')

  // Test nested elements
  expect(body[2].content.spans[0].start).toBe(18)
  expect(body[2].content.spans[0].end).toBe(54)

  expect(body[2].content.spans[1].start).toBe(22)
  expect(body[2].content.spans[1].end).toBe(41)

  // lists
  expect(body[3].type).toBe('list-item')
  expect(body[4].content.spans[0].type).toBe('em')

})
