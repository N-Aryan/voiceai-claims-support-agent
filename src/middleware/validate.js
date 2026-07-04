const { AppError } = require('../utils/errors');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});

    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Request validation failed.';

      return next(
        new AppError(400, message, {
          details: result.error.flatten(),
        }),
      );
    }

    req.body = result.data;
    return next();
  };
}

module.exports = validate;
