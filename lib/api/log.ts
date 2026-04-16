export async function withApiLogging(
  request: Request,
  handler: () => Promise<Response> | Response
): Promise<Response> {
  const start = Date.now();
  let status = 500;
  try {
    const response = await handler();
    status = response.status;
    return response;
  } finally {
    const durationMs = Date.now() - start;
    console.log(
      JSON.stringify({
        type: "api",
        method: request.method,
        path: new URL(request.url).pathname,
        status,
        durationMs,
        at: new Date().toISOString(),
      })
    );
  }
}
