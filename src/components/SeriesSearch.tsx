"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { useDebouncedCallback } from 'use-debounce';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { SymbolSearchResult } from "@/types"
import yf from "@/lib/yahooFinance"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "./ui/input";

type SeriesSearchProps = {
  onChange: (symbol: SymbolSearchResult) => void
  excludedSymbols?: string[]
}

const SeriesSearch = ({onChange, excludedSymbols = []}: SeriesSearchProps) => {
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState<string>("")
  const [value, setValue] = useState<SymbolSearchResult | null>(null)
  const [searchResults, setSearchResults] = useState<SymbolSearchResult[] | null>(null)

  const handleQueryChange = useDebouncedCallback(async (query: string) => {
    console.log({ query })
    if(!query) {
      setSearchResults([])
      return
    }

    if(query.length < 3) return

    setSearching(true)
    const result = await yf.search(query)
    console.log(result)

    setSearchResults(() => {
      console.log("Setting search results", result)
      return result
    })
    setSearching(false)
  }, 300)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add a stock</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-4/5 flex flex-col">
        <DialogHeader>
          <DialogTitle>Add a stock</DialogTitle>
          <DialogDescription>
            Search for a stock to add to your chart
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 py-4">
          <Input
            id="query"
            value={query}
            onChange={(e) => {setQuery(e.target.value); handleQueryChange(e.target.value)}}
          />

          <div className="flex flex-col gap-2">
            {searching && <div className="flex items-center justify-between p-2 rounded-md">Searching...</div>}
            {searchResults === null && query.length > 0 && query.length < 3 && <div className="flex items-center justify-between p-2 rounded-md">Type at least 3 characters to search.</div>}
            {searchResults === null && !searching && query && <div className="flex items-center justify-between p-2 rounded-md">No results found.</div>}

            {searchResults && searchResults.map((result, i) => {
              const alreadyPicked = value?.symbol === result.symbol || excludedSymbols.includes(result.symbol)
              return (
                <div
                  className={`
                    flex items-center justify-between p-2 rounded-md
                    ${alreadyPicked ? "text-slate-500" : "cursor-pointer hover:bg-slate-50"}
                    `}
                  tabIndex={1}
                  key={result.symbol}
                  onClick={() => {
                    setQuery("")
                    setSearchResults([])
                    setValue(result)
                    onChange(result)
                  }}
                >
                  {result.shortname} ({result.symbol})
                  <Check className={cn(
                    "mr-2 h-4 w-4",
                    alreadyPicked ? "opacity-100" : "opacity-0"
                    )} />
                </div>
              )
            })}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SeriesSearch
