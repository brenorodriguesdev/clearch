import type { HttpRequest, HttpResponse } from '@presentation/contracts/http';

export interface Controller {
  handle(httpRequest: HttpRequest): Promise<HttpResponse>;
}
