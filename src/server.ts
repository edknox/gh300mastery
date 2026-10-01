import { createApp } from "./app.js";

function getPort(value: string | undefined): number {
  const port = value === undefined ? 3000 : Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

const port = getPort(process.env.PORT);
const app = createApp();

app.listen(port, () => {
  console.log(`Task API listening on port ${port}`);
});
