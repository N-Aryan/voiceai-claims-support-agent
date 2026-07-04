const app = require('./app');
const { env } = require('./config/env');

app.listen(env.PORT, () => {
  console.log(
    `observe-insurance-claims-agent listening on port ${env.PORT} in ${env.NODE_ENV} mode`,
  );
});
