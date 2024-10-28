import { execSync } from "child_process";

const processId = process.argv[2];

if (!processId) {
  console.error("Please provide a process id");
  process.exit(1);
}

function run() {
  const command = `cd /proc/${processId}/task && ls | tr '\n' ' ' | sed 's/ /\\/stat /g' | xargs cat $1`;

  const result = execSync(`adb shell "${command}"`).toString();

  console.log(result);
}

run();
