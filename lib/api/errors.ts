import { NextResponse } from "next/server";

export type JsonErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  const payload: JsonErrorPayload = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(payload, { status });
}
