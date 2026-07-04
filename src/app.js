const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const customerRoutes = require('./routes/customer.routes');
const claimsRoutes = require('./routes/claims.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');
const escalationRoutes = require('./routes/escalation.routes');
const logsRoutes = require('./routes/logs.routes');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { AppError } = require('./utils/errors');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use(healthRoutes);
app.use(customerRoutes);
app.use(claimsRoutes);
app.use(knowledgeRoutes);
app.use(escalationRoutes);
app.use(logsRoutes);

app.use((req, res, next) => {
  next(new AppError(404, 'Route not found.'));
});

app.use(errorHandler);

module.exports = app;
