import * as express from 'express';

import { DelugeService } from '../services/DelugeService';
import { DelugeDownload } from '../interfaces';

const delugeService = new DelugeService();

export const downloadFromMagnet = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { magnetUrl, downloadType, options } = req.body as DelugeDownload;

  console.log('Dowloading type => ', downloadType, ' with options ', JSON.stringify(options));

  const torrentId = await delugeService.addTorrentFromMagnet(magnetUrl, downloadType, options?.appendPath);

  return res.json({ torrentId: torrentId });
};
