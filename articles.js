import {List} from 'immutable';
import fetch from 'isomorphic-unfetch';
import request from 'superagent';
import {ArticleFactory} from '../wellcomecollection.org/server/model/article';

const baseUri = 'https://public-api.wordpress.com/rest/v1.1/sites/blog.wellcomecollection.org';

export async function getArticles(size: number = 100, {page = 1, order = 'DESC'}: WordpressQuery = {}, q: string = ''): Promise<ArticleStubsResponse> {
  const uri = `${baseUri}/posts/`;
  const queryObj = constructQueryFromQueryString(q);
  const queryToWpQueryMap = { categories: 'category', tags: 'tag' };
  const wpQueryObject = Object.keys(queryObj).reduce((acc, key: string) => {
    const newKey = queryToWpQueryMap[key] || key;
    return Object.assign({}, acc, {[newKey]: queryObj[key]});
  }, {});

  const query = Object.assign({}, {
    number: size
  }, {page, order}, wpQueryObject);

  const response = await request(uri).query(query);

  const posts = response.body.posts.map(post => {
    return ArticleFactory.fromWpApi(post);
  });

  return {
    length: size,
    total: parseInt(response.body.found, 10),
    data: posts,
    page
  };
}

export async function getArticle(id: string, authToken: ?string = null) {
  const uri = `${baseUri}/posts/${id}`;
  const response = authToken ? await request(uri).set('Authorization', `Bearer ${authToken}`) : await request(uri);
  const valid = response.type === 'application/json' && response.status === 200;

  if (valid) {
    return ArticleFactory.fromWpApi(response.body);
  }
}

export function constructQueryFromQueryString(q: string): { page?: number, categories?: string, tags?: string } {
  const allowedProps = ['categories', 'tags'];

  return q.split(';').reduce((acc, keyAndValue) => {
    const [key, value] = keyAndValue.split(':');
    return allowedProps.indexOf(key) !== -1 && value ? Object.assign({}, acc, {[key]: value}) : acc;
  }, {});
}
