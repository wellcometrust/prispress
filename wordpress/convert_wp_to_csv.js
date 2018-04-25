#!/usr/bin/env node
import fs from 'fs';
import mkdirp from 'mkdirp';
import {getArticles} from './articles';

async function getAllArticles(acc = [], page = 1) {
  const response = await getArticles(100, {page});
  const articles = acc.concat(response.data);
  const m = response.page * response.length < response.total ? await getAllArticles(articles, response.page + 1) : articles;

  return m;
}

async function writeArticleJson() {
  const articles = await getAllArticles();
  const data = [['Title', 'Link', 'Date published', 'Has featured image', 'Has promo', 'Has standfirst']].concat(articles.map(article => {
    const id = article.url.replace(/^\/articles\//, '');
    const link = `https://wellcomecollection.org/articles/${id}`;
    const title = article.headline;
    const datePublished = article.datePublished;
    const promo = article.thumbnail;
    const standfirst = article.bodyParts.find(p => p.type === 'standfirst')
    const featuredImage = article.mainMedia.find(m => m.type === 'picture');

    return [`"${title}"`, link, datePublished.toISOString(), Boolean(featuredImage), Boolean(promo), Boolean(standfirst)];
  }));
  const dataString = data.map(row => row.join(',')).join('\n');

  mkdirp.sync('./.dist/csv');
  fs.writeFile(`./.dist/csv/wordpress_articles.csv`, dataString, (err) => {
    if (err) throw (err);
    console.log('The CSV was saved!');
  });
}

writeArticleJson();
