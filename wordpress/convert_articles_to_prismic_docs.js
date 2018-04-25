#!/usr/bin/env node
import fs from 'fs';
import mkdirp from 'mkdirp';
import {articleToPrismicParser} from './parsers';
import keeps from './keeps';

mkdirp.sync('./.dist/prismic');

fs.readdir('./.dist/articles', (err, files) => {
  if (err) throw err;
  files.forEach((file, i) => {
    fs.readFile(`./.dist/articles/${file}`, (err, data) => {
      if (err) throw err;
      const obj = JSON.parse(data);
      const slug = obj.url.replace('/articles/', '');
      const prismicDoc = JSON.stringify(articleToPrismicParser(slug, obj, i), null, 2);

      if (keeps.includes(slug)) {
        fs.writeFile(`./.dist/prismic/${slug}.json`, prismicDoc, (err) => {
          if (err) throw (err);
          // console.log('The file was saved!');
        });
      }
    });
  });
});
