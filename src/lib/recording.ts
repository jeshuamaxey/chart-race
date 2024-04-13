// @ts-ignore
import { Recorder, RecorderStatus, Encoders } from "canvas-record";
// @ts-ignore
import createCanvasContext from "canvas-context";
// @ts-ignore
import { AVC } from "media-codecs";
import { Canvg } from 'canvg';

type SetupRecordingOptions = {
  chartRef: React.MutableRefObject<HTMLDivElement | null>;
  setRecording: (fn: (prev: boolean) => boolean) => void;
  durationMs: number;
  pixelRatio: number;
  width: number;
  height: number;
  padding?: number;
  offscreen?: boolean;
}

const OFFSET_X = -54;
const OFFSET_Y = -11;

const setupRecording = ({
  chartRef,
  setRecording,
  durationMs,
  pixelRatio,
  width,
  height,
  padding = 0,
  offscreen = true
}: SetupRecordingOptions) => {

  const w = width// * pixelRatio;
  const h = height// * pixelRatio;

  const { context, canvas }: {
    context: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
  } = createCanvasContext("2d", {
    width: w,
    height: h,
    contextAttributes: { willReadFrequently: true },
    offscreen
  });

  // Write the current svg chart to the canvas
  async function canvasRender() {
    if(!chartRef.current) return

    const svg = chartRef.current.querySelector('svg')?.cloneNode(true) as SVGSVGElement

    if(!svg) return

    svg.setAttribute('viewbox', `0 0 ${w} ${h}`);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const offsetX = OFFSET_X + padding;
    const offsetY = OFFSET_X + padding;
    
    // console.log("canvasRender :: offsetX", offsetX)
    // console.log("canvasRender :: offsetY", offsetY)

    const svgBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    svgBg.setAttribute("x", (OFFSET_X-padding).toString());
    svgBg.setAttribute("y", (OFFSET_Y-padding).toString());
    svgBg.setAttribute("width", w.toString());
    svgBg.setAttribute("height", h.toString());
    svgBg.setAttribute("fill", "white");

    svg.prepend(svgBg);

    const debugSvgStr = `
      <svg xmlns="http://www.w3.org/2000/svg" background="hotpink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect x="0" y="0" width="${width}" height="${height}" fill="hotpink" />
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
    duration: 1000*durationMs,
    frameRate: 60,
    encoderOptions: {
      codec: AVC.getCodec({ profile: "Main", level: "5.2" }),
    },
    // encoder: new Encoders.H264MP4Encoder({
    //   debug: true,
    //   speed: 0,
    //   frameRate: 60,
    //   // profile: "Main",
    //   // level: "5.2"
    // }),
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
    canvasRender();
    if (canvasRecorder.status !== RecorderStatus.Recording) return;
    await canvasRecorder.step();
  }

  return {
    canvas,
    recordFrame,
    canvasRecorder
  }
}

export default setupRecording;