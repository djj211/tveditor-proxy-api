import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import { setupHandler } from '../../ExpressHandler';

import * as express from 'express';

import { getShows, postShow, putShow, deleteShow, searchShow } from '../../controllers/Shows';

export const app = express();
export const showsPath = '/api/shows';
export const searchPath = '/api/search';

app.get(showsPath, getShows);
app.post(showsPath, postShow);
app.put(`${showsPath}/:showId`, putShow);
app.delete(`${showsPath}/:showId`, deleteShow);
app.get(searchPath, searchShow);

const handler = setupHandler(app);

module.exports.handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const result = await handler(event, context);
  return result;
};
