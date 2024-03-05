"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"
import { SymbolSearchResult } from "@/types"
import yf from "@/lib/yahooFinance"

type SeriesSearchProps = {
  onChange: (symbol: SymbolSearchResult) => void
  excludedSymbols?: string[]
}

const SeriesSearch = ({onChange, excludedSymbols = []}: SeriesSearchProps) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<SymbolSearchResult | null>(null)
  const [searchResults, setSearchResults] = useState<SymbolSearchResult[]>([])

  const handleQueryChange = async (query: string) => {
    console.log({ query })
    if(!query || query.length < 3) return

    const result = await yf.search(query)
    console.log(result)

    setSearchResults(result)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[400px] justify-between"
        >
          {!!value
            ? value.shortname
            : "Search for a symbol..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search..." onValueChange={handleQueryChange} />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {searchResults.map((result) => (
              <CommandItem
                key={result.symbol}
                disabled={excludedSymbols.includes(result.symbol)}
                value={result.symbol}
                onSelect={(symbol: string) => {
                  const pick = searchResults.find(sr => sr.symbol.toLowerCase() === symbol.toLowerCase())!
                  setValue(pick)
                  onChange(pick)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value?.symbol === result.symbol ? "opacity-100" : "opacity-0"
                  )}
                />
                {result.shortname} ({result.symbol})
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default SeriesSearch