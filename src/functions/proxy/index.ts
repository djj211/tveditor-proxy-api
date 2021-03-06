import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import { setupHandler } from '../../ExpressHandler';

import * as express from 'express';

import { getShows, postShow, putShow, deleteShow, searchShow } from '../../controllers/Shows';
import { getMovies, postMovie, putMovie, deleteMovie, searchMovie } from '../../controllers/Movies';
import { downloadFromMagnet } from '../../controllers/Deluge';
import { searchTorrents, dowloadTorrent } from '../../controllers/TorrentSearch';

export const app = express();
export const showsPath = '/api/shows';
export const moviesPath = '/api/movies';
export const searchPath = '/api/search';
export const searchMoviePath = '/api/search/movies';
export const searchShowPath = '/api/search/shows';
export const torrentSearchPath = '/api/torrents/search';
export const torrentSearchAddPath = '/api/torrents/search/add';
export const torrentAddPath = '/api/torrents/add';

// Shows
app.get(showsPath, getShows);
app.post(showsPath, postShow);
app.put(`${showsPath}/:showId`, putShow);
app.delete(`${showsPath}/:showId`, deleteShow);

// Movies
app.get(moviesPath, getMovies);
app.post(moviesPath, postMovie);
app.put(`${moviesPath}/:movieId`, putMovie);
app.delete(`${moviesPath}/:movieId`, deleteMovie);

// Search
app.get(searchPath, searchShow);
app.get(searchShowPath, searchShow);
app.get(searchMoviePath, searchMovie);

// Torrents
app.get(torrentSearchPath, searchTorrents);
app.post(torrentSearchAddPath, dowloadTorrent);
app.post(torrentAddPath, downloadFromMagnet);

const handler = setupHandler(app);

module.exports.handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const result = await handler(event, context);
  return result;
};
