const Joi = require("joi");
const { password, pin } = require("./custom.validation");

const register = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    userName: Joi.string().required(),
    email: Joi.string().required().email(),
    phone: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    password: Joi.string().required().custom(password),
    pin: Joi.string().required().custom(pin),
  }),
};

const login = {
  body: Joi.object().keys({
    userName: Joi.string().required(),
    password: Joi.string().required().custom(password),
    pin: Joi.string().required().custom(pin),
  }),
};

module.exports = {
  register,
  login
};


