import { SearchResult } from "../../node_modules/yahoo-finance2/dist/esm/src/modules/search";
import { ChartResultObject } from "../../node_modules/yahoo-finance2/dist/esm/src/modules/chart";

const search = async (query: string): Promise<SearchResult["quotes"]> => {
  const result = await fetch(`/api/stocks/search?query=${query}`)
  const json = await result.json()
  return json
}

const chart = async (query: string, body: {}): Promise<ChartResultObject> => {
  const result = await fetch(`/api/stocks/chart?query=${query}`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
  const json = await result.json()
  return json
}

const yf = {
  search,
  chart
}

export default yf