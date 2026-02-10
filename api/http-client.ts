import { getApiBaseUrl } from '@/api/api-environment';

export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
}

export type ApiSuccess<TData> = {
  ok: true;
  status: number;
  data: TData;
};

export type ApiFailure = {
  ok: false;
  status: number;
  error: string;
};

export type ApiResult<TData> = ApiSuccess<TData> | ApiFailure;

export interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
  queryParams?: Record<string, string | number | boolean | undefined>;
}

const buildUrl = (
  path: string,
  queryParams?: Record<string, string | number | boolean | undefined>
): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${getApiBaseUrl()}${normalizedPath}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { message?: string };
      return payload.message ?? `Request failed (${response.status})`;
    }

    const textPayload = await response.text();
    return textPayload || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
};

const parseSuccessData = async <TData>(response: Response): Promise<TData> => {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as TData;
  }

  return (await response.text()) as TData;
};

export const httpRequest = async <TData>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiResult<TData>> => {
  const { method = HttpMethod.Get, body, token, queryParams } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['auth-token'] = token;
  }

  const response = await fetch(buildUrl(path, queryParams), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await parseErrorMessage(response);
    return {
      ok: false,
      status: response.status,
      error,
    };
  }

  const data = await parseSuccessData<TData>(response);
  return {
    ok: true,
    status: response.status,
    data,
  };
};
