import pino from "pino";

const transport = pino.transport({
  targets: [
    {
      level: 'info',
      target: 'pino-pretty', // must be installed separately
      options: {},
    }, 
    {
      level: 'trace',
      target: 'pino/file',
      options: { destination: './reef-explorer.log' }
    }
  ]
})

export const logger = pino(transport);