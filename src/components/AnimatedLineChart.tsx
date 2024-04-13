import { Series } from "@/types"
import { useMemo, useRef, useState } from "react"
import { AxisOptions, Chart } from "react-charts"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { X, Pause, Play, RotateCcw, Video, Download, Circle, CircleDot } from "lucide-react"
import { addDays, differenceInDays } from "date-fns"
import setupRecording from "@/lib/recording";
import { createChartDate, createChartTitle } from "@/lib/svgUtils"

const USDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const Percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

type DailyPrice = {
  date: string,
  close: number,
}

type ChartSeries = {
  label: string,
  data: DailyPrice[]
}

type AnimatedLineChartProps = {
  series: Series[]
  dateRange: [string, string]
  lookAhead: number
  duration: number
  chartType?: 'line' | 'area',
  rebase?: boolean
  padding?: number
  showRender?: boolean
  title: string,
  showDate?: boolean
}

const AnimatedLineChart = ({series,
  dateRange,
  lookAhead,
  duration,
  chartType = 'line',
  rebase = false,
  padding = 0,
  showRender = false,
  title,
  showDate = false
}: AnimatedLineChartProps) => {
  const DURATION_MS = duration || 1
  const PIXEL_RATIO = Math.min(devicePixelRatio, 4);
  const WIDTH = 1080
  const HEIGHT = 1080

  const chartRef = useRef<HTMLDivElement | null>(null)
  const renderRef = useRef<HTMLDivElement | null>(null)

  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  
  const requestRef = useRef<number | undefined>();
  // this is a time stamp of the play event for the current animation
  const startTimeRef = useRef<number | undefined>();
  // this is a time stamp of the last pause event for the current animation
  const pauseTimeRef = useRef<number | undefined>();
  // this accumulates the time paused since the animation first started playing after a reset
  const clockAdjustmentRef = useRef<number>(0);
  // this is a time stamp of the previous frame in the current animation
  const previousTimeRef = useRef<number | undefined>();

  const initRecording = () => setupRecording({
    chartRef,
    setRecording,
    durationMs: DURATION_MS,
    pixelRatio: PIXEL_RATIO,
    width: WIDTH,
    height: HEIGHT,
    padding,
    offscreen: !showRender
  })

  const {
    recordFrame,
    canvasRecorder
  } = initRecording()

  const play = () => {
    if(elapsed >= DURATION_MS) {
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

  const tick = (time: number, recordFrame?: () => void, onComplete?: () => void) => {
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
    
    const done = time - startTimeRef.current - clockAdjustmentRef.current > DURATION_MS;
    previousTimeRef.current = time;

    if(done) {
      onComplete && onComplete()
      pause()
    }
    else {
      if(recordFrame) {
        recordFrame()
        requestRef.current = requestAnimationFrame((time) => tick(time, recordFrame, onComplete));
      } else {
        requestRef.current = requestAnimationFrame(tick);
      }
    }
  }

  const startRecording = async () => {
    if(!chartRef.current || !renderRef.current || recording) {
      return
    }

    reset();
    
    // Start and encode frame 0
    await canvasRecorder.start();
    
    const onComplete = async () => {
      await canvasRecorder.stop();
    }

    // Animate to encode the rest
    requestRef.current = requestAnimationFrame((time) => tick(time, recordFrame, onComplete));
  }

  const daysSpan = differenceInDays(dateRange[1], dateRange[0])
  const daysElapsed = Math.round(daysSpan*elapsed/DURATION_MS)
  const maxDate = addDays(dateRange[0], daysElapsed).toISOString().split("T")[0]

  const chartData: ChartSeries[] = series.map((s) => {
    if(!s.data) return {label: s.symbol.shortname, data: []}
    const rebaseDenominator = rebase ? s.data.quotes[0].close : 1
    return {
      label: s.symbol.shortname,
      color: s.config.color.hex,
      data: s.data.quotes
        .filter((d: NonNullable<Series["data"]>["quotes"], i: number) => {
          return i <= Math.max(lookAhead, daysElapsed)
        })
        .map((d: NonNullable<Series["data"]>["quotes"], i: number) => {
          const close = d.date <= maxDate || i === 0 ? d.close/rebaseDenominator : null
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

  const secondaryAxes = useMemo(
    (): AxisOptions<DailyPrice>[] => [
      {
        getValue: datum => datum.close,
        elementType: chartType,
        formatters: {
          scale: (value: number) => rebase ? Percent.format(value) : USDollar.format(value),
        }
      },
    ],
    [chartType, rebase]
  )

  const elapseReadoutMinutes = Math.floor(elapsed / 60000)
  const elapseReadoutSeconds = Math.floor((elapsed % 60000) / 1000)
  const durationReadoutMinutes = Math.floor(duration / 60000)
  const durationReadoutSeconds = Math.floor((duration % 60000) / 1000)

  const svg = chartRef.current?.querySelector("svg")

  if(svg) {
    const chartTitleId = "chartTitle"
    const chartDateDisplayId = "chartDateDisplay"

    let chartTitle = svg.querySelector(`text#${chartTitleId}`)
    let chartDateDisplay = svg.querySelector(`text#${chartDateDisplayId}`)

    if(!chartTitle) {
      chartTitle = createChartTitle(chartTitleId, WIDTH/2, padding)
      svg.appendChild(chartTitle)
    }
    
    if(!chartDateDisplay) {
      chartDateDisplay = createChartDate(chartDateDisplayId, WIDTH/2, padding)
      svg.appendChild(chartDateDisplay)
    }

    chartTitle.textContent = title
    const month = new Date(maxDate).toLocaleString('default', { month: 'long' })
    const year = new Date(maxDate).getFullYear()
    chartDateDisplay.textContent = `${month} ${year}`

    chartDateDisplay.setAttribute("display", showDate ? "block" : "none")

  }

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[560px] w-[560px] mx-auto border border-green-500" ref={chartRef}>
        <Chart
          options={{
            data: chartData,
            primaryAxis,
            secondaryAxes,
            tooltip: false,
            primaryCursor: false,
            secondaryCursor: false,
            getSeriesStyle: (series) => ({color: series.originalSeries.color}),
            padding: {top: padding, right: padding, bottom: padding, left: padding}
          }}
          />
      </div>

      <div className="w-full flex flex-row gap-2">
        <Button disabled={recording} variant="ghost" size="sm" onClick={playing ? () => pause() : () => play()}>{playing ? <Pause size={16} /> : <Play size={16} />}</Button>
        <Button disabled={recording} variant="ghost" size="sm" onClick={reset}><RotateCcw size={16} /></Button>
        <Button variant="ghost" size="sm" disabled={recording} onClick={startRecording}>
          {recording
            ? <><CircleDot className="animate-pulse" color={"red"} size={16}/></>
            : <><Download size={16} /></>
          }
        </Button>
        <Slider disabled value={[elapsed/DURATION_MS]} min={0} max={1} step={0.001} />
        <p className="w-48 self-center text-right text-xs">
          {elapseReadoutMinutes.toString().padStart(2, '0')}:{elapseReadoutSeconds.toString().padStart(2, '0')} / {durationReadoutMinutes.toString().padStart(2, '0')}:{durationReadoutSeconds.toString().padStart(2, '0')}
        </p>
      </div>

      <div ref={renderRef} className="w-[1080px] h-[1080px]"></div>
    </div>
  )
}

export default AnimatedLineChart
