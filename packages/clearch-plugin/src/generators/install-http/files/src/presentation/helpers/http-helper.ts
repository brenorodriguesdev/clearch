import type { HttpResponse } from '@presentation/contracts/http';

export function ok(data: unknown): HttpResponse {
  return { statusCode: 200, body: data };
}

export function created(data: unknown): HttpResponse {
  return { statusCode: 201, body: data };
}

export function noContent(): HttpResponse {
  return { statusCode: 204 };
}

export function badRequest(message: string): HttpResponse {
  return { statusCode: 400, body: { error: message } };
}

export function serverError(message: string): HttpResponse {
  return { statusCode: 500, body: { error: message } };
}
