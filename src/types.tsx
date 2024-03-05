import {SearchResult} from "../node_modules/yahoo-finance2/dist/esm/src/modules/search";

export type SymbolSearchResult = SearchResult["quotes"][0]

export type Series = {
  name: string;
  symbol: SymbolSearchResult;
  config: {
    color: {name: string, hex: string}
  }
}