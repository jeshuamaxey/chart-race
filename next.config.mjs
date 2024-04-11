/** @type {import('next').NextConfig} */
const nextConfig = {
  // Solve misconfigured/missing imports from canvas-record
  // https://github.com/dmnsgn/canvas-record/issues/14#issuecomment-1685298773
  webpack: (config) => {
      config.resolve.alias['/node_modules/@ffmpeg/core/dist/ffmpeg-core.js'] =
          '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js';
      config.resolve.alias['fs'] = false;
      return config;
  },
};

export default nextConfig;
