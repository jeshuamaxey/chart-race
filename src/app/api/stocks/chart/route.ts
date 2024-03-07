export const dynamic = 'force-dynamic' // defaults to auto

import { NextResponse } from 'next/server';
import { z } from 'zod';
import yahooFinance from 'yahoo-finance2';
import { ChartOptions } from "../../../../../node_modules/yahoo-finance2/dist/esm/src/modules/chart";

const chartOptionsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})
.strict();

export async function POST(request: Request) {
  console.log('GET /api/stocks/chart')

  const query = new URL(request.url).searchParams.get('query')
  
  if (!query) {
    const errorResponse = NextResponse.json({ error: 'Query not provided' }, { status: 400 })
    return errorResponse
  }

  const body = await request.json()

  try {
    await chartOptionsSchema.parseAsync(body);
  } catch (error) {
    let err = error;
    if (err instanceof z.ZodError) {
      err = err.issues.map((e) => ({ path: e.path[0], message: e.message }));
    }
    const errorResponse = NextResponse.json({ error: err }, { status: 400 })
    return errorResponse
  }

  const requestQueryOptions = await chartOptionsSchema.parseAsync(body);

  const defaultQueryOptions: ChartOptions = {
    period1: '2022-03-01',  // start
    period2: '2024-03-01',  // end
    interval: "1d",         // 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
  };

  const queryOptions = {...defaultQueryOptions}
  if(requestQueryOptions.startDate) queryOptions.period1 = requestQueryOptions.startDate
  if(requestQueryOptions.endDate) queryOptions.period2 = requestQueryOptions.endDate

  try { 
    const result = await yahooFinance.chart(query, queryOptions);
    
    const sanitizedResult = result
    
    const response = NextResponse.json(sanitizedResult)
    return response
  } catch (error) {
    console.error('Error fetching chart data', error)
    const errorResponse = NextResponse.json({ error: 'Error fetching chart data' }, { status: 500 })
    return errorResponse
  }
}