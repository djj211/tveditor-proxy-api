import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import { setupHandler } from '../../ExpressHandler';

import * as express from 'express';

import { login, refreshToken } from '../../controllers/Authentication';

export const app = express();
export const loginPath = '/auth/login';
export const refreshPath = '/auth/refresh';

app.post(loginPath, login);
app.post(refreshPath, refreshToken);

const handler = setupHandler(app);

module.exports.handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const result = await handler(event, context);
  return result;
};
