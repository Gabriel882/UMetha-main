import { Buffer } from "buffer";
import process from "process";

// Polyfills for browser compatibility
if (typeof global === "undefined") {
  global = globalThis;
}

if (typeof Buffer === "undefined") {
  global.Buffer = Buffer;
}

if (typeof process === "undefined") {
  global.process = process;
}
