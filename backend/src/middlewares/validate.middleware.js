// src/middlewares/validate.middleware.js

const joiValidate = (schemas) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    };

    const errors = [];

    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, validationOptions);
      if (error) {
        errors.push(...error.details.map(d => ({
          field:   d.path.join('.'),
          message: d.message,
          type:    d.type,
        })));
      } else {
        req.body = value;
      }
    }

    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, validationOptions);
      if (error) {
        errors.push(...error.details.map(d => ({
          field:   'params.' + d.path.join('.'),
          message: d.message,
          type:    d.type,
        })));
      } else {
        req.params = value;
      }
    }

    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, validationOptions);
      if (error) {
        errors.push(...error.details.map(d => ({
          field:   'query.' + d.path.join('.'),
          message: d.message,
          type:    d.type,
        })));
      } else {
        req.query = value;
      }
    }

    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Données invalides',
        errors,
      });
    }

    next();
  };
};

module.exports = joiValidate;