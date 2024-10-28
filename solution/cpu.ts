import { execSync } from "child_process";

let previousStats: Map<string, number> | null = null;

export type Measure = {
  id: string;
  name: string;
  cpuUsage: number;
};

function run(pid: string, onMeasure: (cpuUsagePerThread: Measure[]) => void) {
  const command = `cd /proc/${pid}/task && ls | tr '\n' ' ' | sed 's/ /\\/stat /g' | xargs cat $1`;
  const threadStats = execSync(`adb shell "${command}"`).toString();

  const stats = threadStats
    .split("\n")
    .filter(Boolean)
    .map((stat) => {
      const columns = stat.split(/ (?![^\\(]*\))/);

      if (!columns) {
        throw new Error(`Invalid line: ${stat}`);
      }

      const utime = parseInt(columns[13]);
      const stime = parseInt(columns[14]);

      return {
        id: columns[0],
        name: columns[1],
        cpuTime: utime + stime,
      };
    });

  if (previousStats === null) {
    previousStats = new Map();
  } else {
    const cpuUsagePerThread = stats.map((stat) => {
      const previousCpuTime = previousStats?.get(stat.id) || 0;
      const cpuTimeDiff = stat.cpuTime - previousCpuTime;

      return {
        id: stat.id,
        name: stat.name,
        cpuUsage: cpuTimeDiff,
      };
    });

    onMeasure(
      cpuUsagePerThread.sort((a, b) => b.cpuUsage - a.cpuUsage).slice(0, 5)
    );
  }

  for (const stat of stats) {
    previousStats.set(stat.id, stat.cpuTime);
  }
}

export function pollMeasures(
  pid: string,
  onMeasure: (cpuUsagePerThread: Measure[]) => void
) {
  setInterval(() => run(pid, onMeasure), 1000);
}
