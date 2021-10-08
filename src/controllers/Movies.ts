import * as express from 'express';
import { FlexgetService } from '../services/FlexgetService';
import { TVDBService } from '../services/TVDBService';

const flexgetService = new FlexgetService();
const tvdbService = new TVDBService();

const getTvDbMovie = async (id: number, name: string) => {
  const movieMapping = await flexgetService.getTVDBMovieMapping(id);

  if (movieMapping) {
    return tvdbService.getMovie(movieMapping.tvdbId);
  }

  return tvdbService.searchOneMovie(name);
};

export const getMovies = async (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  const foundMovies = await flexgetService.getAllMovies();
  const movies = await Promise.all(
    foundMovies.map(async (f) => {
      return {
        flexget: f,
        tvdb: await getTvDbMovie(f.id, f.name),
      };
    }),
  );

  return res.json(movies);
};

export const putMovie = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const movieId = req.params.movieId;
  const { name, year, tvdbId } = req.body;
  const flexgetMovie = await flexgetService.getSingleMovie(movieId);

  if (flexgetMovie) {
    if (name !== flexgetMovie.name || year !== flexgetMovie.year) {
      const movieMapping = await flexgetService.getTVDBMovieMapping(+movieId);
      if (movieMapping) {
        await flexgetService.deleteMovie(+movieId);
        const resp = await flexgetService.addMovie(name, +year, tvdbId);
        return res.json(resp);
      }
    }
    return res.json(flexgetMovie);
  }

  return;
};

export const deleteMovie = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const movieId = req.params.movieId;
  const flexgetMovie = await flexgetService.getSingleMovie(movieId);

  if (flexgetMovie) {
    const resp = await flexgetService.deleteMovie(+movieId);
    return res.json(resp);
  }
  return;
};

export const postMovie = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { name, year, tvdbId } = req.body;
  const resp = await flexgetService.addMovie(name, +year, tvdbId);
  return res.json(resp);
};

export const searchMovie = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const queryStr = req.query.queryStr as string;
  console.log(`Searching TVDB movie with queryStr = ${queryStr} `);
  const show = await tvdbService.searchMovie(queryStr);
  return res.json(show);
};
