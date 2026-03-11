import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { StatusCodes } from 'http-status-codes';
import { createMcpServer } from './server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Username',
};

export async function handleMcpRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    const requestedHeaders =
      req.headers.get('access-control-request-headers') ?? corsHeaders['Access-Control-Allow-Headers'];
    return new Response(null, {
      status: StatusCodes.NO_CONTENT,
      headers: { ...corsHeaders, 'Access-Control-Allow-Headers': requestedHeaders },
    });
  }

  const authHeader = req.headers.get('authorization') ?? undefined;
  const defaultUsername = req.headers.get('x-username') ?? undefined;
  const server = createMcpServer({ authHeader, defaultUsername });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    const response = await transport.handleRequest(req);
    return new Response(response.body, {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), ...corsHeaders },
    });
  } finally {
    await transport.close();
    await server.close();
  }
}
