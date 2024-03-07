import { Series } from "@/types"
import { useMemo, useRef, useState } from "react"
import { AxisOptions, Chart } from "react-charts"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { Pause, Play, RotateCcw } from "lucide-react"
import { addDays, differenceInDays } from "date-fns"

type AnimatedLineChartProps = {
  series: Series[]
  dateRange: [string, string]
  lookAhead: number
  duration: number
  chartType?: 'line' | 'area'
}

const AnimatedLineChart = ({series, dateRange, lookAhead, duration, chartType = 'line'}: AnimatedLineChartProps) => {
  const DURATION = duration || 1
  
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  
  const requestRef = useRef<number | undefined>();
  // this is a time stamp of the play event for the current animation
  const startTimeRef = useRef<number | undefined>();
  // this is a time stamp of the last pause event for the current animation
  const pauseTimeRef = useRef<number | undefined>();
  // this accumulates the time paused since the animation first started playing after a reset
  const clockAdjustmentRef = useRef<number>(0);
  // this is a time stamp of the previous frame in the current animation
  const previousTimeRef = useRef<number | undefined>();

  const play = () => {
    if(elapsed >= DURATION) {
      return
    }

    if(pauseTimeRef.current) {
      clockAdjustmentRef.current += performance.now() - pauseTimeRef.current
      pauseTimeRef.current = undefined
    }
    setPlaying(true)
    requestAnimationFrame(tick)
  }

  const pause = () => {
    if(requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }
    pauseTimeRef.current = performance.now()
    previousTimeRef.current = undefined
    setPlaying(false)
  }

  const reset = () => {
    pause()
    setElapsed(0)

    clockAdjustmentRef.current = 0;
    pauseTimeRef.current = undefined;
    startTimeRef.current = undefined;
    previousTimeRef.current = undefined;
    requestRef.current = undefined;
  }

  const tick = (time: number) => {
    // runs only on first animation frame
    if (startTimeRef.current === undefined) {
      startTimeRef.current = time - clockAdjustmentRef.current;
    }

    // runs every other frame after the first
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      
      // Pass on a function to the setter of the state
      // to make sure we always have the latest state
      setElapsed(prevProgress => {
        return prevProgress + deltaTime
      });
    }
    
    const done = time - startTimeRef.current - clockAdjustmentRef.current > DURATION;

    if(done) {
      pause()
    } else {
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(tick);
    }

  }

  const handleSliderChange = ([n]: number[]) => {
    setElapsed(n*DURATION)
    pause()
  }

  type DailyPrice = {
    date: string,
    close: number,
  }

  type ChartSeries = {
    label: string,
    data: DailyPrice[]
  }


  const daysSpan = differenceInDays(dateRange[1], dateRange[0])
  const daysElapsed = Math.round(daysSpan*elapsed/DURATION)
  const maxDate = addDays(dateRange[0], daysElapsed).toISOString().split("T")[0]

  const chartData: ChartSeries[] = series.map((s) => {
    if(!s.data) return {label: s.symbol.shortname, data: []}
    return {
      label: s.symbol.shortname,
      data: s.data.quotes
        .filter((d: NonNullable<Series["data"]>["quotes"], i: number) => {
          return i <= Math.max(lookAhead, daysElapsed)
        })
        .map((d: NonNullable<Series["data"]>["quotes"], i: number) => {
          const close = d.date <= maxDate || i === 0 ? d.close : null
          return {
            date: d.date,
            close
          }
        })
    }
  })

  const primaryAxis = useMemo(
    (): AxisOptions<DailyPrice> => ({
      scaleType: 'time',
      getValue: datum => new Date(datum.date),
    }),
    []
  )

  const USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const secondaryAxes = useMemo(
    (): AxisOptions<DailyPrice>[] => [
      {
        getValue: datum => datum.close,
        elementType: chartType,
        formatters: {
          scale: (value: number) => USDollar.format(value),
        }
      },
    ],
    [chartType]
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="h-96">
        <Chart
          options={{
            data: chartData,
            primaryAxis,
            secondaryAxes,
          }}
          />
          {/* <span>{chartData[0].data.length}</span>
          <code>
            <pre>
              {JSON.stringify(chartData, null, 2)}
            </pre>
          </code> */}
      </div>


      <div className="w-full flex flex-row gap-2">
        <Button size="sm" onClick={playing ? pause : play}>{playing ? <Pause /> : <Play />}</Button>
        <Button size="sm" onClick={reset}><RotateCcw /></Button>

        {/* <span>startTimeRef: {startTimeRef.current}</span>
        <span>pauseTimeRef: {pauseTimeRef.current}</span>
        <span>clockAdjustmentRef: {clockAdjustmentRef.current}</span>
        <span>elapsed: {elapsed}</span>
        <span>progress: {Math.round(100*elapsed/DURATION)}%</span> */}

        <Slider disabled
          onValueChange={handleSliderChange}
          value={[elapsed/DURATION]} min={0} max={1} step={0.001} />
      </div>
    </div>
  )
}

export default AnimatedLineChart