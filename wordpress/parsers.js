import {convertHtmlToPrismicData} from './convert_to_prismic_data';
var n = {};
const noop = () => {};
const deHtml = s => s.replace(/<\/?[^>]+(>|$)/g, '');
const bodyPartTypeToParser = {
  'video-embed': convertVideo,
  pre: convertPre,
  html: convertHtml,
  standfirst: convertStandfirst,
  heading: convertHeading,
  picture: convertImage,
  video: convertVideo,
  wpVideo: noop,
  list: convertList,
  tweet: convertTweet,
  instagramEmbed: convertInstagram,
  imageGallery: convertImageGallery,
  quote: convertQuote,
  soundcloudEmbed: convertSoundcloudEmbed,
  iframe: convertIframe
};

function convertSoundcloudEmbed(value, weight) {
  return {
    key: 'soundcloudEmbed',
    value: {
      repeat: [],
      'non-repeat': {
        iframeSrc: value.iframeSrc
      }
    }
  };
}

function convertIframe(value, weight) {
  return {
    key: 'iframe',
    value: {
      repeat: [],
      'non-repeat': {
        iframeSrc: value.src
      }
    }
  };
}

// TODO: Make sure this get's `pre`ed
function convertPre(value, weight) {
  return {
    key: 'excerpt',
    value: {
      'non-repeat': {
        content: [{
          type: 'paragraph',
          content: {
            text: deHtml(value),
            spans: []
          }
        }]
      }
    }
  };
}

function convertStandfirst(value, weight, slug) {
  const p = convertHtmlToPrismicData(value);
  if (p && p.nonConverts.length > 0) {
    n[slug] = (n[slug] || []).concat([p.nonConverts]);
    console.info(slug)
  }

  return {
    key: 'standfirst',
    value: {
      'non-repeat': {
        text: [p.converts]
      }
    }
  };
}

function convertHtml(value, weight, slug) {
    if (
      /<(\w+)(?:\s+\w+="[^"]+(?:"\$[^"]+"[^"]+)?")*>\s*<\/\1>/.test(value) ||  // empty HTML tags <h1></h1>
      value.match('v0.wordpress.com/js/next')
    ) {
      return null;
    }

    return convertParagraph(value, weight, slug);
}

function convertParagraph(value, weight, slug) {
  const p = convertHtmlToPrismicData(value);
  if (p && p.nonConverts.length > 0) {
    n[slug] = (n[slug] || []).concat([p.nonConverts]);
  }

  return {
    key: 'text',
    value: {
      'non-repeat': {
        text: [p.converts]
      }
    }
  };
}

function convertHeading(value, weight) {
  return {
    key: 'text',
    value: {
      'non-repeat': {
        text: [{
          type: 'heading2',
          content: {
            text: deHtml(value.value),
            spans: []
          }
        }]
      }
    }
  };
}

function convertImage(value, weight, slug) {
  return {
    key: 'editorialImage',
    label: weight,
    value: {
      'non-repeat': Object.assign({}, createPrismicImageWithCaption(value, slug), {weight})
    }
  };
}

function convertImageGallery(value, weight, slug) {
  const items = value.items.map(item => {
    return createPrismicImageWithCaption(item, slug);
  });
  return {
    key: 'editorialImageGallery',
    value: {
      repeat: items
    }
  };
}

function convertQuote(value, weight) {
  const quoteText = value.quote || value.body;
  return {
    key: 'quote',
    value: {
      'non-repeat': {
        quote: [{
          type: 'paragraph',
          content: {
            text: deHtml(quoteText),
            spans: []
          }
        }],
        source: [{
          type: 'paragraph',
          content: {
            text: value.citation ? deHtml(value.citation) : null,
            spans: []
          }
        }],
        citation: value.citation
      }
    }
  };
}

function createPrismicImageWithCaption(image: Picture, slug) {
  // if (!image.contentUrl) { console.info(slug) }
  const caption = image.caption ? convertHtmlToPrismicData(image.caption) : null;
  return {
    caption: (caption && caption.converts && [caption.converts]) || [{
      type: 'paragraph',
      content: {
        text: '',
        spans: []
      }
    }],
    image: {
      origin: {
        // id : '',
        url: image.contentUrl,
        width: image.width,
        height: image.height
      },
      name: image.contentUrl && 'wordpress-import-' + image.contentUrl.replace('https://wellcomecollection.files.wordpress.com/', '').replace(/\//g, '-'),
      width: image.width,
      height: image.height,
      url: image.contentUrl,
      edit: {
        background: 'transparent',
        zoom: 1.0,
        crop: {
          x: 0,
          y: 0
        }
      },
      credits: image.copyright && image.copyright.holder,
      alt: image.alt,
      thumbnails: {}
    }
  };
}

function convertVideo(value, weight) {
  const ytId = value.embedUrl.match(/embed\/([^?].*)\?/);

  return {
    key: 'youtubeVideoEmbed',
    label: 'weight',
    value: {
      'non-repeat': {
        weight,
        embed: {
          type: 'video',
          embed_url: `https://youtube.com/watch?v=${ytId[1]}`
        }
      }
    }
  };
}

function convertInstagram(value, weight) {
  const instagramId = value.html.match(/https:\/\/www\.instagram\.com\/p\/(\d+|\w+)/)[1];
  return {
    key: 'instagramEmbed',
    value: {
      'non-repeat': {
        weight,
        embed: {
          type: 'video',
          embed_url: `https://www.instagram.com/p/${instagramId}/`
        }
      }
    }
  };
}

function convertTweet(value, weight) {
  const twitterMatch = value.html.match(/https:\/\/twitter\.com\/\d+|\w+\/status\/\d+/)[0];
  return {
    key: 'twitterEmbed',
    value: {
      'non-repeat': {
        weight,
        embed: {
          type: 'video',
          embed_url: `https://twitter.com/${twitterMatch}`
        }
      }
    }
  };
}

function convertPromo(image, text, slug) {
  const newImage = Object.assign({}, image, {caption: text});
  return {
    key: 'editorialImage',
    value: {
      'non-repeat': createPrismicImageWithCaption(newImage, 'promo')
    }
  };
}

function convertList(value, weight) {
  const listItems = value.items.map(item => {
    return {
      listItem: [{
        type: 'paragraph',
        content: {
          text: item,
          spans: []
        }
      }]
    };
  });

  return {
    key: 'list',
    value: {
      repeat: listItems,
      'non-repeat': {
        'description': [{
          type: 'paragraph',
          content: {
            text: '',
            spans: []
          }
        }]
      }
    }
  };
}

export function articleToPrismicParser(slug: string, article: Article, i) {
  const mainMediaVideo = article.mainMedia.find(media => media.type === 'video');
  const mainMediaImage = article.mainMedia.find(media => media.type === 'picture');
  const mainMedia = mainMediaVideo ? convertVideo(mainMediaVideo, 'featured') : (mainMediaImage ? convertImage(mainMediaImage, 'featured') : null);

  const promoImage = mainMediaVideo ? mainMediaImage : article.thumbnail;
  const promo = convertPromo(promoImage, article.description, slug);

  const content = article.bodyParts.map((part, i) => {
    const parser = bodyPartTypeToParser[part.type];

    if (!parser) {
      console.info(`> Could not find parser: ${part.type}`, part.value);
    } else {
      const value = parser(part.value, part.weight, slug);
      return value;
    }
  }).filter(_ => _);

  // if (n[slug] && [slug].length > 0) console.info(slug, n[slug]);

  return {
    type: 'articles',
    wordpressSlug: slug,
    tags: ['wordpress', 'not_proofread'],
    title: [{
      'type': 'heading1',
      'content': {
        'text': article.headline,
        'spans': []
      }
    }],
    publishDate: article.datePublished,
    promo: [promo],
    body: [mainMedia].filter(_ => _).concat(content)
  };
}
