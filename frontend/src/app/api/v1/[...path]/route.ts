import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || process.env.BACKEND_URL || 'http://backend:4000';

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path ? path.join('/') : '';
  const searchParams = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${searchParams}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Exclude hop-by-hop headers
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  try {
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody ? await req.arrayBuffer() : undefined;

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
    });

    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    const resData = await backendRes.arrayBuffer();
    return new NextResponse(Buffer.from(resData), {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[API Proxy Error] Failed to proxy ${req.method} to ${targetUrl}:`, err);
    return NextResponse.json(
      {
        status: 'error',
        message: `Backend proxy connection failed: ${err.message}`,
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
export const HEAD = handleProxy;
