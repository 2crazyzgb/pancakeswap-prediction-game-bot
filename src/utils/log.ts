import { appendFile } from "fs";
import { join } from "path";

export function log(...args: Array<string | number>) {
  console.log.apply(console, args);
  return new Promise<void>((resolve, reject) => {
    const str = args
      .map((item) => item.toString().replace(/\[\d+m/g, ""))
      .join(" ");
    appendFile(
      join(__dirname, "../", "log2.txt"),
      "\r\n" + str,
      "utf8",
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}
