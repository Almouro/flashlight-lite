import { execSync } from "child_process";

let previousMeasures: Map<string, number> | null = null;

function run(processId: string) {
  const command = `cd /proc/${processId}/task && ls | tr '\n' ' ' | sed 's/ /\\/stat /g' | xargs cat $1`;

  const result = execSync(`adb shell "${command}"`).toString();

  const lines = result
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const columns = line.split(/ (?![^\\(]*\))/);

      if (!columns) {
        throw new Error(`Invalid line: ${line}`);
      }

      const utime = parseInt(columns[13]);
      const stime = parseInt(columns[14]);

      return {
        id: columns[0],
        name: columns[1],
        cpuTime: utime + stime,
      };
    });

  if (previousMeasures === null) {
    previousMeasures = new Map();
  } else {
    console.clear();
    console.log(
      lines
        .map((line) => ({
          name: line.name,
          cpuTimeDiff: line.cpuTime - (previousMeasures?.get(line.id) || 0),
        }))
        .sort((a, b) => b.cpuTimeDiff - a.cpuTimeDiff)
        .slice(0, 3)
    );
  }

  for (const line of lines) {
    previousMeasures.set(line.id, line.cpuTime);
  }
}

const processId = process.argv[2];

if (!processId) {
  console.error("Please provide a process id");
  process.exit(1);
}

setInterval(() => run(processId), 1000);
