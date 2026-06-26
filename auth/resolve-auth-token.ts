import { LoginResponse } from "@/api/types";

const getTokenFromStringResponse = (value: string): string | null => {
  const trimmedValue = value.trim().replace(/^"(.+)"$/, "$1");

  if (!trimmedValue) {
    return null;
  }

  const bearerPrefix = "bearer ";

  if (trimmedValue.toLowerCase().startsWith(bearerPrefix)) {
    const bearerToken = trimmedValue.slice(bearerPrefix.length).trim();
    return bearerToken.length > 0 ? bearerToken : null;
  }

  if (/\s/.test(trimmedValue)) {
    return null;
  }

  return trimmedValue;
};

export const resolveAuthToken = (
  loginResponse: LoginResponse,
): string | null => {
  if (typeof loginResponse === "string") {
    return getTokenFromStringResponse(loginResponse);
  }

  if (loginResponse.token) {
    return loginResponse.token;
  }

  if (loginResponse.authToken) {
    return loginResponse.authToken;
  }

  if (loginResponse.jwt) {
    return loginResponse.jwt;
  }

  if (loginResponse.data?.token) {
    return loginResponse.data.token;
  }

  if (typeof loginResponse.data?.message === "string") {
    const tokenFromDataMessage = getTokenFromStringResponse(
      loginResponse.data.message,
    );
    if (tokenFromDataMessage) {
      return tokenFromDataMessage;
    }
  }

  if (typeof loginResponse.message === "string") {
    const tokenFromMessage = getTokenFromStringResponse(loginResponse.message);
    if (tokenFromMessage) {
      return tokenFromMessage;
    }
  }

  if (typeof loginResponse.error === "string") {
    const tokenFromError = getTokenFromStringResponse(loginResponse.error);
    if (tokenFromError) {
      return tokenFromError;
    }
  }

  return null;
};

export const resolveLoginFailureMessage = (
  loginResponse: LoginResponse,
): string | null => {
  if (typeof loginResponse === "string") {
    const trimmedValue = loginResponse.trim();

    if (!trimmedValue) {
      return null;
    }

    if (getTokenFromStringResponse(trimmedValue)) {
      return null;
    }

    return trimmedValue;
  }

  if (
    typeof loginResponse.message === "string" &&
    loginResponse.message.trim()
  ) {
    return loginResponse.message.trim();
  }

  if (typeof loginResponse.error === "string" && loginResponse.error.trim()) {
    return loginResponse.error.trim();
  }

  if (
    typeof loginResponse.data?.message === "string" &&
    loginResponse.data.message.trim()
  ) {
    return loginResponse.data.message.trim();
  }

  return null;
};
