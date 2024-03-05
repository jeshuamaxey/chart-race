export const dynamic = 'force-dynamic' // defaults to auto

import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  console.log('GET /api/stocks/search')

  const query = new URL(request.url).searchParams.get('query')

  if (!query) {
    const errorResponse = NextResponse.json({ error: 'Query not provided' }, { status: 400 })
    return errorResponse
  }

  if(query.length < 3) {
    const errorResponse = NextResponse.json({ error: 'Query too short' }, { status: 400 })
    return errorResponse
  }

  const result = await yahooFinance.search(query, {
    quotesCount: 5,
    newsCount: 0,
  })

  const sanitizedResult = result.quotes.filter(q => q.isYahooFinance)

  const response = NextResponse.json(sanitizedResult)
  return response
}