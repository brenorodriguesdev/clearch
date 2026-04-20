import { registerGrpcRuntimePlaceholder } from '@main/adapters/grpc/grpc-runtime-placeholder';

/** gRPC transport entry — extend when you add protos and @grpc/grpc-js. */
export async function bootstrapGrpcTransport(): Promise<void> {
  await registerGrpcRuntimePlaceholder();
}
