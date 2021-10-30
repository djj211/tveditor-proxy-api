import * as express from 'express';

import { TorrentSearchDownload, TORRENT_SEARCH_TYPE } from '../interfaces';
import { DelugeService } from '../services/DelugeService';

import { TorrentSearchService } from '../services/TorrentSearchService';

const torrentSearchSerice = new TorrentSearchService();
const delugeService = new DelugeService();

export const searchTorrents = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const query = req.query.query as string;
  const type = req.query.type as TORRENT_SEARCH_TYPE;
  const limit = req.query.limit as string;
  const provider = req.query.provider as string;
  torrentSearchSerice.setProvider(provider);

  console.log('DOING SEARCH WITH query => ', query, ' limit => ', limit, 'provider => ', provider, ' and type ', type);
  const results = await torrentSearchSerice.search(query, +limit, type);

  res.json(results);
};

export const dowloadTorrent = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { torrent, downloadType, options } = req.body as TorrentSearchDownload;

  if (!torrent) return;

  const magnetUrl = await torrentSearchSerice.getTorrentMagnet(torrent);

  const torrentId = await delugeService.addTorrentFromMagnet(magnetUrl, downloadType, options?.appendPath);

  return res.json(torrentId);
};
