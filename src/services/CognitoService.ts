import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { InitiateAuthRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';

export class CognitoService {
  private cognitoidentityserviceprovider: CognitoIdentityServiceProvider;

  constructor() {
    this.cognitoidentityserviceprovider = new CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
  }

  private async doAuth(params: InitiateAuthRequest) {
    const authResult = await this.cognitoidentityserviceprovider.initiateAuth(params).promise();

    return {
      token: authResult.AuthenticationResult?.AccessToken,
      refreshToken: authResult.AuthenticationResult?.RefreshToken,
    };
  }

  public login(username: string, password: string) {
    const params: InitiateAuthRequest = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    return this.doAuth(params);
  }

  public refresh(token: string) {
    const params: InitiateAuthRequest = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        REFRESH_TOKEN: token,
      },
    };

    return this.doAuth(params);
  }
}
