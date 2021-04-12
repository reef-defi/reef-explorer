const config = require('./backend.config.js');
const Backend = require('./src/Backend.js');

async function main() {
  const backend = new Backend(config);
  backend.runCrawlers();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});
