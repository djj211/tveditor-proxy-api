'use strict';

import * as jwt from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import * as request from 'bent';
import { APIGatewayAuthorizerEvent, Context } from 'aws-lambda';

const region = process.env.AWS_REGION!;
const cognitoUserPoolId = process.env.USER_POOL_ID!;

const iss = `https://cognito-idp.${region}.amazonaws.com/${cognitoUserPoolId}`;

export interface JsonWebKey {
  kid?: string;
  kty: string;
  e: string;
  n: string;
  use?: string;
}

export interface JsonWebKeys {
  keys: JsonWebKey[];
}

/**
 * Entry point for authorizer lambda.  The authorizer inspects the incoming
 * token and validates the encrypted signature.
 * The return result is an aws policy for execution of the endpoint lambda function.
 *
 * @param event - custom authorizer event triggered when protected api endpoints are called
 * @param context - execution context of the lambda
 */
export const authorizer = async (event: APIGatewayAuthorizerEvent, context: Context) => {
  try {
    if (event.type === 'TOKEN') {
      console.log('Auth function invoked');
      console.log(JSON.stringify(event), JSON.stringify(context));
      // Remove 'bearer ' from token:
      const token = event.authorizationToken.substring(7);

      const decodedToken = jwt.decode(token, { complete: true });
      console.log('token => ', JSON.stringify(decodedToken));

      if (!decodedToken || typeof decodedToken === 'string' || !decodedToken.payload || !decodedToken.header?.kid) {
        throw new Error('invalid access token.');
      }

      // Make a request to the iss + .well-known/jwks.json URL:
      const getJSON = request('json');
      const jwks = (await getJSON(`${iss}/.well-known/jwks.json`)) as JsonWebKeys;

      const jwk = jwks.keys.find((key: JsonWebKey) => {
        return key.kid === decodedToken.header.kid;
      });
      if (!jwk) throw new Error('invalid access token signing key.');

      const jwkArray = {
        kty: jwk.kty as string,
        n: jwk.n as string,
        e: jwk.e as string,
      } as jwkToPem.JWK;

      const pem = jwkToPem(jwkArray);

      jwt.verify(token, pem, { issuer: iss, algorithms: ['RS256'] });

      const resourceList: string[] = [];
      resourceList.push(`arn:aws:execute-api:${region}:*:*/GET/*`);
      resourceList.push(`arn:aws:execute-api:${region}:*:*/POST/*`);
      resourceList.push(`arn:aws:execute-api:${region}:*:*/PUT/*`);
      resourceList.push(`arn:aws:execute-api:${region}:*:*/PATCH/*`);
      resourceList.push(`arn:aws:execute-api:${region}:*:*/DELETE/*`);

      const authResponse = {
        principalId: decodedToken?.payload.sub,
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['execute-api:Invoke'],
              Resource: resourceList,
            },
          ],
        },
      };

      return authResponse;
    } else {
      console.log('No authorizationToken found in the header.');
      throw new Error('No authorizationToken found in the header.');
    }
  } catch (err) {
    console.error('authorization error: ', JSON.stringify(err));
    throw new Error('Authorization Error.');
  }
};
