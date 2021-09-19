import * as express from 'express';

import { CognitoService } from '../services/CognitoService';

const cognitoService = new CognitoService();

export const login = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { username, password } = req.body;
  const resp = await cognitoService.login(username, password);

  return res.json(resp);
};

export const refreshToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { refreshToken } = req.body;
  const resp = await cognitoService.refresh(refreshToken);
  return res.json(resp);
};
