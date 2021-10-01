import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import { setupHandler } from '../../ExpressHandler';

import * as express from 'express';

import { getShows, postShow, putShow, deleteShow, searchShow } from '../../controllers/Shows';
import { getMovies, postMovie, putMovie, deleteMovie, searchMovie } from '../../controllers/Movies';

export const app = express();
export const showsPath = '/api/shows';
export const moviesPath = '/api/movies';
export const searchPath = '/api/search';
export const searchMoviePath = '/api/search/movies';
export const searchShowPath = '/api/search/shows';

app.get(showsPath, getShows);
app.post(showsPath, postShow);
app.put(`${showsPath}/:showId`, putShow);
app.delete(`${showsPath}/:showId`, deleteShow);

app.get(moviesPath, getMovies);
app.post(moviesPath, postMovie);
app.put(`${moviesPath}/:movieId`, putMovie);
app.delete(`${moviesPath}/:movieId`, deleteMovie);

app.get(searchPath, searchShow);
app.get(searchShowPath, searchShow);
app.get(searchMoviePath, searchMovie);

const handler = setupHandler(app);

module.exports.handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const result = await handler(event, context);
  return result;
};
