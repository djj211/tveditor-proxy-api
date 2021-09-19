import * as httpContext from 'express-http-context';
import * as express from 'express';
import { errorHandler } from './ErrorHandler';
import * as jwt from 'jsonwebtoken';
import * as serverless from 'serverless-http';

export const setupHandler = (app: express.Express) => {
  const expressApplication = express();

  // decode request bodies to json
  expressApplication.use(express.json({ limit: '50mb' }));
  expressApplication.use(express.urlencoded({ extended: false }));

  expressApplication.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  expressApplication.set('etag', false);

  expressApplication.use(httpContext.middleware);

  // setup shared request context
  expressApplication.use((req: any, res: express.Response, next: express.NextFunction) => {
    httpContext.set('requestId', req.requestContext.requestId);
    if (req.headers.authorization) {
      const decodedToken = jwt.decode(getToken(req.headers.authorization));
      if (decodedToken && typeof decodedToken !== 'string') {
        console.log('request authorization ', JSON.stringify(decodedToken));
        httpContext.set('authorization', decodedToken);
      }
    }
    next();
  });

  function getToken(bearerToken?: string) {
    let token = bearerToken;
    if (!token) throw new Error('no token given in authorization header');

    token = token.replace('Bearer ', '');
    return token;
  }

  // lambda function middleware
  expressApplication.use(app);

  // error middleware
  expressApplication.use(errorHandler);
  return serverless(expressApplication);
};
