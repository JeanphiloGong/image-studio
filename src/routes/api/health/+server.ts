import { json } from '@sveltejs/kit';

export function GET() {
  return json({ status: 'ok', version: '0.1.0' }, { headers: { 'Cache-Control': 'no-store' } });
}
