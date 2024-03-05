"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Series, SymbolSearchResult } from "@/types";
import SeriesSettings from "./SeriesSettings";
import SeriesSearch from "./SeriesSearch";
import colors from "@/lib/colors";

const ChartConfigurator = () => {
  const [symbol, setSymbol] = useState<SymbolSearchResult | null>(null);
  const [series, setSeries] = useState<Series[]>([]);
  const [remainingColors, setRemainingColors] = useState(colors)

  const addNewSeries = () => {
    if(!symbol) return;
    const index = Math.floor(Math.random()*remainingColors.length)
    console.log({index, remainingColors})
    const color = remainingColors[index]
    const newSeries = {
      name: symbol.shortname,
      symbol,
      config: {
        color
      }
    }
    setSeries([...series, newSeries])
    const newRemainingColors = [...remainingColors]
    newRemainingColors.splice(index, 1)
    setRemainingColors(newRemainingColors)
  }

  const addButtonDisabled = !symbol || series.find((s) => s.symbol.symbol === symbol.symbol) !== undefined;

  return <div className="flex flex-col lg:flex-row p-4">
    <div className="lg:w-1/2">
      <Card>
        <CardHeader>
          <CardTitle>Series</CardTitle>
          <CardDescription>Add, remove and edit the data in your chart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 w-full">
            {series.length === 0 && <p>No series added yet</p>}
            {series.map((s, i) => {
              const updateSeries = (newSeries: Series) => {
                setSeries(series.map((s) => s.name === newSeries.name ? newSeries : s))
              }

              return <SeriesSettings
                key={s.symbol.symbol}
                series={s}
                onSeriesUpdate={updateSeries}
                onRemoveSeries={(seriesToRm) => setSeries(series.filter((s) => s.name !== seriesToRm.name))}
                />
            })}
          </div>
        </CardContent>
        <CardFooter>
          <div className="div flex flex-col gap-2">
            <Label htmlFor="newSeries">New series name</Label>
            <div className="flex w-full items-center space-x-2">
              <SeriesSearch onChange={setSymbol} excludedSymbols={series.map(s => s.symbol.symbol)} />
              <Button disabled={addButtonDisabled} onClick={addNewSeries}>Add Series</Button>
            </div>
          </div>
        </CardFooter>
        </Card>

        <div className="my-4 w-full border"></div>

    </div>
    <div className="lg:w-1/2">
      <h2 className="text-3xl mb-4">Preview</h2>
      <code>
        <pre>
          {JSON.stringify(series, null, 2)}
        </pre>
      </code>
    </div>
  </div>
}

export default ChartConfigurator;