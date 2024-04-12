import { Series } from "@/types"
import { useMemo, useRef, useState } from "react"
import { AxisOptions, Chart } from "react-charts"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { X, Pause, Play, RotateCcw, Video, ArrowRightCircle } from "lucide-react"
import { addDays, differenceInDays } from "date-fns"
import setupRecording from "@/lib/recording";

const USDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

type AnimatedLineChartProps = {
  series: Series[]
  dateRange: [string, string]
  lookAhead: number
  duration: number
  chartType?: 'line' | 'area'
}

const AnimatedLineChart = ({series, dateRange, lookAhead, duration, chartType = 'line'}: AnimatedLineChartProps) => {
  const DURATION_MS = duration || 1
  const PIXEL_RATIO = Math.min(devicePixelRatio, 2);
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

  // lib
  const {
    canvas,
    recordFrame,
    canvasRecorder
  } = setupRecording({
    chartRef,
    setRecording,
    durationMs: DURATION_MS,
    pixelRatio: PIXEL_RATIO,
    width: WIDTH,
    height: HEIGHT,
  })
  // end lib


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

  const handleSliderChange = ([n]: number[]) => {
    setElapsed(n*DURATION_MS)
    pause()
  }

  const startRecording = async () => {
    console.log("startRecording")

    if(!chartRef.current || !renderRef.current || recording) {
      return
    }

    renderRef.current.innerHTML = "";
    renderRef.current.appendChild(canvas);

    reset();
    
    // Start and encode frame 0
    await canvasRecorder.start();
    
    const onComplete = async () => {
      console.log("onComplete")
      await canvasRecorder.stop();
    }

    // Animate to encode the rest
    requestRef.current = requestAnimationFrame((time) => tick(time, recordFrame, onComplete));
  }

  const cancelRecording = async () => {
    setRecording(false)

    await canvasRecorder.stop();
    reset()
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
  const daysElapsed = Math.round(daysSpan*elapsed/DURATION_MS)
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
      <div className="h-[560px] w-[560px]" ref={chartRef}>
        <Chart
          options={{
            data: chartData,
            primaryAxis,
            secondaryAxes,
            tooltip: false,
            primaryCursor: false,
            secondaryCursor: false,
          }}
          />
      </div>


      <div className="w-full flex flex-row gap-2">
        <Button disabled={recording} size="sm" onClick={playing ? () => pause() : () => play()}>{playing ? <Pause /> : <Play />}</Button>
        <Button disabled={recording} size="sm" onClick={reset}><RotateCcw /></Button>

        <Slider disabled
          onValueChange={handleSliderChange}
          value={[elapsed/DURATION_MS]} min={0} max={1} step={0.001} />

        <Button size="sm" onClick={recording ? () => cancelRecording : startRecording}>
          {recording
            ? <><X />&nbsp;Cancel</>
            : <><Video />&nbsp;Record</>
          }
        </Button>
      </div>

      <div ref={renderRef} className=""></div>
    </div>
  )
}

export default AnimatedLineChart
