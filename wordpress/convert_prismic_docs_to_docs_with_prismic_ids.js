#!/usr/bin/env node
import Prismic from 'prismic-javascript';
import fs from 'fs';
import mkdirp from 'mkdirp';
import {articleToPrismicParser} from './parsers';

mkdirp.sync('./.dist/prismic_with_ids');

async function getArticleWithWordpressSlug(slug) {
  // Bah
  const api = await Prismic.getApi('https://wellcomecollection-dev.prismic.io/api/v2');
  const article = api.query([
    Prismic.Predicates.at('my.articles.wordpressSlug', slug)
  ]);

  return article;
}

async function go() {
  fs.readdir('./.dist/prismic/', (err, files) => {
    if (err) throw err;
    files.forEach((file, i) => {
      fs.readFile(`./.dist/prismic/${file}`, async (err, data) => {
        if (err) throw (err);

        const json = JSON.parse(data);
        const article = await getArticleWithWordpressSlug(json.wordpressSlug);
        const filename = article.results.length > 0 ? article.results[0].id : `_${json.wordpressSlug}`;

        fs.writeFile(`./.dist/prismic_with_ids/${filename}.json`, data, (err) => {
          if (err) throw (err);
        });
      })
    });
  });
}

go();
