"use client";

import { useMemo, useState } from "react";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Series, SymbolSearchResult } from "@/types";
import SeriesSettings from "./SeriesSettings";
import SeriesSearch from "./SeriesSearch";
import colors from "@/lib/colors";
import { Input } from "./ui/input";
import yf from "@/lib/yahooFinance";
import AnimatedLineChart from "./AnimatedLineChart";

const YEAR = 365 * 24 * 60 * 60 * 1000;

const ChartConfigurator = () => {
  const [chartType, setChartType] = useState<'line' | 'area'>('line')
  const [durationInSeconds, setDurationInSeconds] = useState(3)
  const [lookAhead, setLookAhead] = useState(31); // days
  const [symbol, setSymbol] = useState<SymbolSearchResult | null>(null);
  const [series, setSeries] = useState<Series[]>([]);
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(new Date().getTime() - YEAR).toISOString().split("T")[0], // today - 1 year
    new Date().toISOString().split("T")[0]                             // today
  ])
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

  const updateDateRange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.target;
    if(name === 'startdate') {
      setDateRange([new Date(value).toISOString().split("T")[0], dateRange[1]])
    } else if(name === 'enddate') {
      setDateRange([dateRange[0], new Date(value).toISOString().split("T")[0]])
    }
  }

  const loadChartData = ()=> {
    console.log('loading chart data', series, dateRange)
    series.forEach(async (s) => {
      console.log('loading data for', s.symbol.symbol)

      try {

        const res = await yf.chart(s.symbol.symbol, {
          startDate: dateRange[0],
          endDate: dateRange[1]
        })

        setSeries(prevSeries => prevSeries.map((series) => {
        if(series.symbol.symbol === s.symbol.symbol) {
          return {
            ...series,
            data: res
          }
        }
        return series
      }))
      
      console.log('loaded data for', s.symbol.symbol, res)
      } catch (e) {
        console.error('error loading data for', s.symbol.symbol, e)
      }

    })
  }

  const addButtonDisabled = !symbol || series.find((s) => s.symbol.symbol === symbol.symbol) !== undefined;


  // CHART
  const renderChart = series.some((s) => s.data !== undefined)

  return <div className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-1/2">
            <Card>
              <CardHeader>
                <CardTitle>Stocks</CardTitle>
                <CardDescription>Add, remove and edit the data in your chart</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="div flex flex-col gap-2 pb-4">
                  <Label htmlFor="newSeries">New series name</Label>
                  <div className="flex w-full items-center space-x-2">
                    <SeriesSearch onChange={setSymbol} excludedSymbols={series.map(s => s.symbol.symbol)} />
                    <Button disabled={addButtonDisabled} onClick={addNewSeries}>Add Series</Button>
                  </div>
                </div>

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

              <CardHeader>
                <CardTitle>Date range</CardTitle>
                <CardDescription>Set the time span</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="div flex flex-col gap-2 pb-4">
                  <Label htmlFor="startdate">Start date</Label>
                  <div className="flex w-full items-center space-x-2">
                    <Input
                      type="date"
                      name="startdate"
                      value={dateRange[0]}
                      onChange={updateDateRange} />
                  </div>
                </div>
                <div className="div flex flex-col gap-2 pb-4">
                  <Label htmlFor="enddate">End date</Label>
                  <div className="flex w-full items-center space-x-2">
                    <Input
                      type="date"
                      name="enddate"
                      value={dateRange[1]}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={updateDateRange} />
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button disabled={series.length === 0} onClick={loadChartData}>Load chart data</Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:w-1/2">
            <Card>
              <CardHeader>
                <CardTitle>Chart config</CardTitle>
                <CardDescription>Tweak how your chart behaves</CardDescription>
              </CardHeader>
              <CardContent>

                <div className="div flex flex-col gap-2 pb-4">
                  <Label htmlFor="lookahead">Lookahead</Label>
                  <Select name="lookahead" defaultValue={String(lookAhead)} onValueChange={(n) => setLookAhead(Number(n))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Lookahead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="31">1 month</SelectItem>
                      <SelectItem value="182">6 months</SelectItem>
                      <SelectItem value="365">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="div flex flex-col gap-2 pb-4">
                  <Label htmlFor="chartType">Chart type</Label>
                  <Select name="chartType" defaultValue={chartType} onValueChange={(n: 'line' | 'area') => setChartType(n)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="area">Filled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              
                <div className="div flex flex-col gap-2 pb-4">
                  <Label htmlFor="duration">Animation duration (seconds)</Label>
                  <Input type="number" name="duration" value={durationInSeconds} onChange={(ev) => setDurationInSeconds(Number(ev.target.value))} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Preview your animated chart</CardDescription>
          </CardHeader>
          <CardContent>

            { renderChart && <AnimatedLineChart series={series} dateRange={dateRange} lookAhead={lookAhead} duration={1000*durationInSeconds} chartType={chartType}/> }
            {/* <code>
              <pre>
                {JSON.stringify(chartData, null, 2)}
              </pre>
            </code> */}
          </CardContent>
        </Card>
        </div>
      </div>
  </div>
}

export default ChartConfigurator;