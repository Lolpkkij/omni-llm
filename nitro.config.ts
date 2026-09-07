import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  srcDir: "./server",
  devServer: {
    watch: ["./server"],
  },
  // Add any other Nitro-specific configurations here
});