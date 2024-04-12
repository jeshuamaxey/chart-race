"use client";

import dummyData from "./dummyData.json";
import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Series, SymbolSearchResult } from "@/types";
import SeriesSettings from "./SeriesSettings";
import SeriesSearch from "./SeriesSearch";
import colors from "@/lib/colors";
import { Input } from "./ui/input";
import yf from "@/lib/yahooFinance";
import AnimatedLineChart from "./AnimatedLineChart";
import { Badge } from "./ui/badge";
import { Check, Code } from "lucide-react";
import { Switch } from "./ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const YEAR = 365 * 24 * 60 * 60 * 1000;

const ChartConfigurator = () => {
  const [rebase, setRebase] = useState(false)
  const [chartType, setChartType] = useState<'line' | 'area'>('line')
  const [dataNeedsReload, setDataNeedsReload] = useState(true)
  const [durationInSeconds, setDurationInSeconds] = useState(10)
  const [lookAhead, setLookAhead] = useState(31); // days
  const [series, setSeries] = useState<Series[]>([]);
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(new Date().getTime() - YEAR).toISOString().split("T")[0], // today - 1 year
    new Date().toISOString().split("T")[0]                             // today
  ])
  const [remainingColors, setRemainingColors] = useState(colors)

  const addNewSeries = (symbol: SymbolSearchResult) => {
    if(!symbol) return;

    const index = Math.floor(Math.random()*remainingColors.length)
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
    setDataNeedsReload(true)
  }

  const updateDateRange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.target;
    if(name === 'startdate') {
      setDateRange([new Date(value).toISOString().split("T")[0], dateRange[1]])
    } else if(name === 'enddate') {
      setDateRange([dateRange[0], new Date(value).toISOString().split("T")[0]])
    }
    setDataNeedsReload(true)
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
        setDataNeedsReload(false)
      } catch (e) {
        console.error('error loading data for', s.symbol.symbol, e)
      }

    })
  }

  // CHART
  const renderChart = series.some((s) => s.data !== undefined)

  return <div className="p-4">
      <div className="flex gap-4">
      <div className="lg:w-1/3 flex flex-col gap-4">
        <Tabs defaultValue="stockdata">
          <TabsList>
            <TabsTrigger value="stockdata">Stocks</TabsTrigger>
            <TabsTrigger value="daterange">Date range</TabsTrigger>
            <TabsTrigger value="chartconfig">Chart style</TabsTrigger>
          </TabsList>
          <TabsContent value="stockdata">
            <Card>
              <CardContent className="pt-4">
                <div className="div flex flex-col gap-2 pb-4">
                  <div className="flex w-full items-center space-x-2">
                    <SeriesSearch onChange={addNewSeries} excludedSymbols={series.map(s => s.symbol.symbol)} />
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
            </Card>
          </TabsContent>

          <TabsContent value="daterange">
            <Card>
              <CardContent className="pt-4">
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
            </Card>
          </TabsContent>
          
          <TabsContent value="chartconfig">
            <Card>
              <CardContent className="pt-4">
                <div className="div flex flex-col gap-2 pb-4">
                  <Label htmlFor="rebase">Rebase stock value</Label>
                  <Switch
                    checked={rebase}
                    onCheckedChange={() => setRebase(!rebase)}
                  />
                </div>

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
          </TabsContent>
        </Tabs>

        <div className="flex flex-row justify-between items-center">
          {dataNeedsReload ? (
            <Button disabled={series.length === 0} onClick={loadChartData}>Load chart data</Button>
          ) : (
            <Badge className="bg-green-500"><Check size={14} className="mr-2" />Data loaded</Badge>
          )}
        </div>
      </div>

      <div className="lg:w-2/3">
        <div className="h-12 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger><Code /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Debug</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSeries(dummyData as unknown as Series[])}>Load dummy data</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
        <Card>
          <CardContent className="pt-4">
            { renderChart && (
              <AnimatedLineChart
                series={series}
                dateRange={dateRange}
                lookAhead={lookAhead}
                duration={1000*durationInSeconds}
                chartType={chartType}
                rebase={rebase}
                />
              )}
            { !renderChart && <p className="text-center my-16">Choose some stocks to see a preview</p>}
          </CardContent>
        </Card>
      </div>
      </div>
  </div>
}

export default ChartConfigurator;