import app from './app';
import { APP_CONFIGURATION } from './config';

app.listen(APP_CONFIGURATION.httpPort, () => {
  console.log(`Reef explorer API is running on port ${APP_CONFIGURATION.httpPort}.`);
});

