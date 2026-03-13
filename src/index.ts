import { crawlPage } from "./crawl.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("no website provided");
    process.exit(1);
  }

  if (args.length > 1) {
    console.error("too many arguments provided");
    process.exit(1);
  }

  const baseURL = args[0];
  console.log(`starting crawl of: ${baseURL}`);

  const pages = await crawlPage(baseURL);
  console.log(pages);
}

main();
