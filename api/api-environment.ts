export enum ApiEnvironment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

const apiBaseUrlByEnvironment: Record<ApiEnvironment, string> = {
  [ApiEnvironment.Development]: 'https://ice-delivery.fly.dev',
  [ApiEnvironment.Staging]: 'https://ice-delivery.fly.dev',
  [ApiEnvironment.Production]: 'https://ice-delivery.fly.dev',
};

export const resolveApiEnvironment = (): ApiEnvironment => {
  if (__DEV__) {
    return ApiEnvironment.Development;
  }

  return ApiEnvironment.Production;
};

export const getApiBaseUrl = (): string => {
  const environment = resolveApiEnvironment();
  return apiBaseUrlByEnvironment[environment];
};
