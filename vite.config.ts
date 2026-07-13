import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The 3D bundle (three / @react-three) is code-split into its own chunk so it
// never lands in the operator's critical path. TankScene is React.lazy'd, but we
// also name the chunk here so the split is visible and stable in build output.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("three") ||
            id.includes("@react-three") ||
            id.includes("react-reconciler")
          ) {
            return "three";
          }
        },
      },
    },
  },
});
