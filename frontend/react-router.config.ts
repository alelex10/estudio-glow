import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";
import { AUTH } from "./app/common/constants/rute-client";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  presets: [vercelPreset()],
  async prerender() {
    return [AUTH.LOGIN()];
  },
} satisfies Config;
