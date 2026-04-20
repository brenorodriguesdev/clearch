/**
 * Application-side gRPC contract. Keep framework types out of handlers;
 * adapters in `main/adapters/grpc` translate grpc-js call objects into this shape.
 */
export type GrpcHandlerMetadata = Readonly<Record<string, string>>;

export type GrpcHandlerRequest = {
  /** Full method name, e.g. `package.Service/Method`. */
  method: string;
  metadata: GrpcHandlerMetadata;
  message: unknown;
};

export type GrpcHandlerResponse = {
  message?: unknown;
  metadata?: Record<string, string>;
};

export interface GrpcHandler {
  handle(request: GrpcHandlerRequest): Promise<GrpcHandlerResponse> | GrpcHandlerResponse;
}
