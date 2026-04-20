import type { NextFunction, Request, Response } from 'express';
import type { Controller, HttpRequest, HttpResponse } from '@presentation/contracts';

function toHttpRequest(req: Request): HttpRequest {
  return {
    body: req.body,
    params: req.params as Record<string, string>,
    query: req.query as Record<string, string | string[] | undefined>,
    headers: req.headers,
  };
}

function sendHttpResponse(res: Response, httpResponse: HttpResponse): void {
  if (httpResponse.headers) {
    for (const [key, value] of Object.entries(httpResponse.headers)) {
      res.setHeader(key, value);
    }
  }
  if (httpResponse.body === undefined) {
    res.status(httpResponse.statusCode).end();
    return;
  }
  res.status(httpResponse.statusCode).json(httpResponse.body);
}

/** Express bridge: maps Request/Response to framework-agnostic {@link Controller}. */
export function adaptRouter(controller: Controller) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const httpRequest = toHttpRequest(req);
      const httpResponse = await controller.handle(httpRequest);
      sendHttpResponse(res, httpResponse);
    } catch (error) {
      next(error);
    }
  };
}
