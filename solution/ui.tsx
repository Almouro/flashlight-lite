import React, { useState, useEffect } from "react";
// @ts-ignore
import { Box, render, Text } from "ink";
import { Measure, pollMeasures } from "./cpu";

const processId = process.argv[2];

if (!processId) {
  console.error("Please provide a process id");
  process.exit(1);
}

const Counter = () => {
  const [measures, setMeasures] = useState<Measure[]>([]);

  useEffect(() => {
    pollMeasures(processId, setMeasures);
  }, []);

  return (
    <>
      {measures.map(({ id, cpuUsage, name }) => (
        <Box key={id} flexDirection="row">
          <Box width={50}>
            <Text color="green">{name}</Text>
          </Box>
          <Box width={15}>
            <Text color="white">{cpuUsage}</Text>
          </Box>
        </Box>
      ))}
    </>
  );
};

render(<Counter />);
