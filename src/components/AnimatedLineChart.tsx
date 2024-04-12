// @ts-ignore
import { Recorder, RecorderStatus } from "canvas-record";
// @ts-ignore
import createCanvasContext from "canvas-context";
// @ts-ignore
import { AVC } from "media-codecs";
import { Canvg } from 'canvg';

import { Series } from "@/types"
import { useMemo, useRef, useState } from "react"
import { AxisOptions, Chart } from "react-charts"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { X, Pause, Play, RotateCcw, Video, ArrowRightCircle } from "lucide-react"
import { addDays, differenceInDays } from "date-fns"

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

  // console.log({ DURATION_MS, WIDTH, HEIGHT, PIXEL_RATIO })
  
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
  const { context, canvas }: {
    context: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
  } = createCanvasContext("2d", {
    width: WIDTH * PIXEL_RATIO,
    height: HEIGHT * PIXEL_RATIO,
    contextAttributes: { willReadFrequently: true },
  });

  Object.assign(canvas.style, {
    width: `${WIDTH*PIXEL_RATIO}px`,
    height: `${HEIGHT*PIXEL_RATIO}px`,
    // border: "1px solid green",
  });

  // Write the current svg cart to the canvas
  async function canvasRender() {
    console.log("canvasRender")
    if(!chartRef.current) return

    const svg = chartRef.current.querySelector('svg')?.cloneNode(true) as SVGSVGElement

    if(!svg) return

    svg.setAttribute('viewbox', `0 0 ${WIDTH*PIXEL_RATIO} ${HEIGHT*PIXEL_RATIO}`);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    console.log("canvasRender :: should render")
    const offsetX = 54;
    const offsetY = 11;

    const svgBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    svgBg.setAttribute("x", (-1*offsetX).toString());
    svgBg.setAttribute("y", (-1*offsetY).toString());
    svgBg.setAttribute("width", WIDTH.toString());
    svgBg.setAttribute("height", HEIGHT.toString());
    svgBg.setAttribute("fill", "white");

    svg.prepend(svgBg);


    const debugSvgStr = `
      <svg xmlns="http://www.w3.org/2000/svg" background="hotpink" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
        <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="hotpink" />
        <rect x="54" y="11" width="${100}" height="${100}" fill="red" />
      </svg>
    `

    const svgStr = new XMLSerializer().serializeToString(svg);

    const v = Canvg.fromString(context, svgStr, {
      offsetX,
      offsetY,
      ignoreClear: true,
    });
    await v.render();
  }

  const canvasRecorder: Recorder = new Recorder(context, {
    name: "chart-race",
    duration: 1000*DURATION_MS,
    encoderOptions: {
      codec: AVC.getCodec({ profile: "Main", level: "5.2" }),
    },
    onStatusChange: (status: RecorderStatus) => {
      switch (status) {
        case RecorderStatus.Initializing:
          console.log(`${status || "?"} :: Recording initializing`);
          setRecording(() => true);
          break;
        case RecorderStatus.Recording:
          console.log(`${status || "?"} :: Recording started`);
          setRecording(() => true);
          break;
        case RecorderStatus.Stopped:
          console.log(`${status || "?"} :: Recording stopped`);
          setRecording(() => false);
          break;
        case RecorderStatus.Stopping:
          console.log(`${status || "?"} :: Recording stopping`);
          setRecording(() => false);
          break;
      }
    }
  });
  
  const recordFrame = async () => {
    console.log("recordFrame")
    canvasRender();
    if (canvasRecorder.status !== RecorderStatus.Recording) return;
    await canvasRecorder.step();
  }
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
