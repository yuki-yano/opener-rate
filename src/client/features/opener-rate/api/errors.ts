export type ApiClientErrorCode =
  | "http_error"
  | "network_error"
  | "invalid_response_schema";

export class ApiClientError extends Error {
  readonly code: ApiClientErrorCode;
  readonly status?: number;

  constructor(params: {
    code: ApiClientErrorCode;
    message: string;
    status?: number;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = "ApiClientError";
    this.code = params.code;
    this.status = params.status;
    if ("cause" in Error.prototype) {
      (this as Error & { cause?: unknown }).cause = params.cause;
    }
  }
}
