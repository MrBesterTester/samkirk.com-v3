/**
 * Health check endpoint for Cloud Run.
 *
 * Returns a simple JSON response indicating the service is running.
 * Used by Cloud Run for health checks and readiness probes.
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
