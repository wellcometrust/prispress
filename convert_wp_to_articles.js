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
  articles.forEach(article => {
    const id = article.url.replace(/^\/articles\//, '');
    mkdirp.sync('./.dist/articles');

    fs.writeFile(`./.dist/articles/${id}.json`, JSON.stringify(article), (err) => {
      if (err) throw (err);
      console.log('The file was saved!');
    });
  });
}

writeArticleJson();
