import { InitiateAuthRequest, CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';

export class CognitoService {
  private cognitoidentityserviceprovider: CognitoIdentityProvider;

  constructor() {
    this.cognitoidentityserviceprovider = new CognitoIdentityProvider({ apiVersion: '2016-04-18' });
  }

  private async doAuth(params: InitiateAuthRequest) {
    const authResult = await this.cognitoidentityserviceprovider.initiateAuth(params);

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
