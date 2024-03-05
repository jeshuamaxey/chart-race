import { SearchResult } from "../../node_modules/yahoo-finance2/dist/esm/src/modules/search";

const search = async (query: string): Promise<SearchResult["quotes"]> => {
  const result = await fetch(`/api/stocks/search?query=${query}`)
  const json = await result.json()
  return json
}

const yf = {
  search
}

export default yf