import { validateEnv } from './config/env';

// Validate env before anything else
const env = validateEnv();

import { app } from './app';

const port = env.PORT;

app.listen(port, () => {
  console.log(`Server listening on port ${port} in ${env.NODE_ENV} mode`);
});
