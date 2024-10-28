import { execSync, spawn } from "child_process";

const processId = process.argv[2];

if (!processId) {
  console.error("Please provide a process id");
  process.exit(1);
}

const previousCpuTime = new Map<string, number>();
let hasMeasuredOnce = false;

function run() {
  const command = `cd /proc/${processId}/task && ls | tr '\n' ' ' | sed 's/ /\\/stat /g' | xargs cat $1`;

  const result = execSync(`adb shell "${command}"`).toString();

  const lines = result.split("\n").filter(Boolean);

  const threadStats = lines.map((line) => {
    const columns = line.split(/ (?![^\(]*\))/);

    if (!columns) {
      throw new Error(`Invalid line: line`);
    }

    const pid = columns[0];
    const name = columns[1];
    const utime = columns[13];
    const stime = columns[14];

    const cpuTime = parseInt(utime) + parseInt(stime);

    return {
      pid,
      name,
      cpuTime,
    };
  });

  if (hasMeasuredOnce) {
    console.clear();
    console.log(
      threadStats
        .map((threadStat) => {
          const previousCpuTimeForThread =
            previousCpuTime.get(threadStat.pid) || 0;
          const cpuTimeDiff = threadStat.cpuTime - previousCpuTimeForThread;
          return {
            name: threadStat.name,
            cpuTimeDiff,
          };
        })
        .sort((a, b) => b.cpuTimeDiff - a.cpuTimeDiff)
        .slice(0, 3)
    );
  } else {
  }

  hasMeasuredOnce = true;
  threadStats.forEach((thread) => {
    previousCpuTime.set(thread.pid, thread.cpuTime);
  });
}

// setInterval(run, 1000);

execSync("adb shell atrace --async_stop");
spawn("adb", ["shell", "atrace", "-c", "view", "-t", "999"]);

const adbShell = spawn("adb", [
  "shell",
  "cat",
  "/sys/kernel/tracing/trace_pipe",
]);

let frameCount = 0;

adbShell.stdout.on("data", (data) => {
  const lines: string[] = data.toString().split("\n").filter(Boolean);

  lines.forEach((line) => {
    if (
      line.includes("Choreographer#doFrame") &&
      line.includes(`-${processId} `)
    ) {
      frameCount++;
    }
  });
});

setInterval(() => {
  console.log("Frame count: ", frameCount);
  frameCount = 0;
}, 1000);
