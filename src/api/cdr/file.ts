import * as fs from "fs";
import * as readline from "readline";

export async function readFile(filePath: string): Promise<void> {
  const stream = fs.createReadStream(filePath);

  stream.on("error", (err) => {
    console.error("Read stream error:", err);
    throw err;
  });

  const lineReader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  try {
    for await (const line of lineReader) {
      console.log(line);
    }
  } catch (err) {
    console.error(`Error while reading lines from file ${filePath}:`, err);
    throw err;
  }
}

export async function writeFile(
  records: Iterable<string> | AsyncIterable<string>,
  filePath: string
): Promise<void> {
  const stream = fs.createWriteStream(filePath);

  stream.on("error", (err) => {
    console.error("Write stream error:", err);
    throw err;
  });

  try {
    for await (const record of records as AsyncIterable<string>) {
      const ok = stream.write(record + "\n");

      if (!ok) {
        await waitForDrain(stream);
      }
    }

    stream.end();
  } catch (err) {
    console.error(`Error while writing file ${filePath}:`, err);
    throw err;
  }
}

function waitForDrain(stream: NodeJS.WritableStream): Promise<void> {
  return new Promise(resolve => {
    stream.once("drain", resolve);
  });
}
