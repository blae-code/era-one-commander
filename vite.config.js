import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split the heavy visualization/animation vendors out of the entry chunk
        // so first paint doesn't pay for them. Function form: only modules that
        // are actually in the graph get assigned (an object form would force-
        // include unused packages).
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-recharts';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer-motion';
          }
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/micromark') || id.includes('node_modules/mdast-') || id.includes('node_modules/remark-') || id.includes('node_modules/unified')) {
            return 'vendor-markdown';
          }
        }
      }
    }
  }
});
