export type HttpRequest = {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
};

export type HttpResponse = {
  statusCode: number;
  body?: unknown;
  headers?: Record<string, string>;
};
