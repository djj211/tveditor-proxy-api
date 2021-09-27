import * as express from 'express';
import { FlexgetService } from '../services/FlexgetService';
import { TVDBService } from '../services/TVDBService';

const flexgetService = new FlexgetService();
const tvdbService = new TVDBService();

const getTvDbShow = async (id: number, name: string) => {
  const showMapping = await flexgetService.getTVDBMapping(id);

  if (showMapping) {
    return tvdbService.getSeries(showMapping.tvdbId);
  }

  return tvdbService.searchOne(name);
};

export const getShows = async (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  const foundShows = await flexgetService.getSeries();
  const shows = await Promise.all(
    foundShows.map(async (f) => {
      return {
        flexget: f,
        tvdb: await getTvDbShow(f.id, f.name),
      };
    }),
  );

  return res.json(shows);
};

export const postShow = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { name, season, episode, tvdbId } = req.body;
  const resp = await flexgetService.addSeries(name, season, episode, tvdbId);
  return res.json(resp);
};

export const putShow = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const showId = req.params.showId;
  const { name, season, episode } = req.body;
  const flexgetShow = await flexgetService.getSingleSeries(showId);
  if (flexgetShow) {
    if (name !== flexgetShow.name) {
      const showMapping = await flexgetService.getTVDBMapping(+showId);
      if (showMapping) {
        await flexgetService.deleteSeries(+showId, flexgetShow.name);
        const resp = await flexgetService.addSeries(name, season, episode, showMapping.tvdbId);
        return res.json(resp);
      }
    }

    const resp = await flexgetService.editSeries(+showId, name, season, episode);
    return res.json(resp);
  }

  return;
};

export const deleteShow = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const showId = req.params.showId;
  const flexgetShow = await flexgetService.getSingleSeries(showId);

  if (flexgetShow) {
    const resp = await flexgetService.deleteSeries(+showId, flexgetShow.name);
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
