// @ts-ignore
import { Recorder, RecorderStatus } from "canvas-record";
// @ts-ignore
import createCanvasContext from "canvas-context";
// @ts-ignore
import { AVC, H264MP4 } from "media-codecs";
import { Canvg } from 'canvg';

type SetupRecordingOptions = {
  chartRef: React.MutableRefObject<HTMLDivElement | null>;
  setRecording: (fn: (prev: boolean) => boolean) => void;
  durationMs: number;
  pixelRatio: number;
  width: number;
  height: number;
}

const setupRecording = ({
  chartRef,
  setRecording,
  durationMs,
  pixelRatio,
  width,
  height,
}: SetupRecordingOptions) => {

  const { context, canvas }: {
    context: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
  } = createCanvasContext("2d", {
    width: width * pixelRatio,
    height: height * pixelRatio,
    contextAttributes: { willReadFrequently: true },
  });

  Object.assign(canvas.style, {
    width: `${width*pixelRatio}px`,
    height: `${height*pixelRatio}px`,
  });

  // Write the current svg cart to the canvas
  async function canvasRender() {
    console.log("canvasRender")
    if(!chartRef.current) return

    const svg = chartRef.current.querySelector('svg')?.cloneNode(true) as SVGSVGElement

    if(!svg) return

    svg.setAttribute('viewbox', `0 0 ${width*pixelRatio} ${height*pixelRatio}`);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    console.log("canvasRender :: should render")
    const offsetX = 54;
    const offsetY = 11;

    const svgBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    svgBg.setAttribute("x", (-1*offsetX).toString());
    svgBg.setAttribute("y", (-1*offsetY).toString());
    svgBg.setAttribute("width", width.toString());
    svgBg.setAttribute("height", height.toString());
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

  return {
    canvas,
    recordFrame,
    canvasRecorder
  }
}

export default setupRecording;