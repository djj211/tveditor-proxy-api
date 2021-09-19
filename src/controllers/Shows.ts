import * as express from 'express';
import { FlexgetService } from '../services/FlexgetService';
import { TVDBService } from '../services/TVDBService';

const flexgetService = new FlexgetService();
const tvdbService = new TVDBService();

export const getShows = async (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  const foundShows = await flexgetService.getSeries();
  console.log('FOUND SHOWS =>', foundShows);
  const shows = await Promise.all(
    foundShows.map(async (f) => {
      return {
        flexget: f,
        tvdb: await tvdbService.searchOne(f.name),
      };
    }),
  );

  console.log('SHOWS TO RETURN => ', JSON.stringify(shows));
  return res.json(shows);
};

export const postShow = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { name, season, episode } = req.body;
  const resp = await flexgetService.addSeries(name, season, episode);
  return res.json(resp);
};

export const putShow = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { showId, name, season, episode } = req.body;
  const flexgetShow = await flexgetService.getSingleSeries(showId);
  if (flexgetShow) {
    const resp = await flexgetService.editSeries(showId, name, season, episode);
    return res.json(resp);
  }

  return;
};

export const deleteShow = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const showId = req.params.showId;
  const flexgetShow = await flexgetService.getSingleSeries(showId);

  if (flexgetShow) {
    const resp = await flexgetService.deleteSeries(showId, flexgetShow.name);
    return res.json(resp);
  }
  return;
};

export const searchShow = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const queryStr = req.query.queryStr as string;
  console.log('Querying for shows with => ', queryStr);
  const show = await tvdbService.search(queryStr);
  return res.json(show);
};
