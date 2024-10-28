import { execSync } from "child_process";
import { spawn } from "child_process";

// snippet
execSync("adb shell atrace --async_stop");
spawn("adb", ["shell", "atrace", "-c", "view", "-t", "999"]);

let currentFrameCount = 0;

// snippet
const adbShell = spawn("adb", [
  "shell",
  "cat",
  "/sys/kernel/tracing/trace_pipe",
]);

const processId = process.argv[2];

adbShell.stdout?.on("data", (data) => {
  const lines: string[] = data.toString().split("\n").filter(Boolean);

  const frameCount = lines.filter(
    (line) =>
      line.includes("Choreographer#doFrame") && line.includes(`-${processId} `)
  ).length;

  currentFrameCount += frameCount;
});

setInterval(() => {
  console.log(currentFrameCount);
  currentFrameCount = 0;
}, 1000);
