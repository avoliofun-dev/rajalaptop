import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '192.168.68.144',
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
