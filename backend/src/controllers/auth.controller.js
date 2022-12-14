const httpStatus = require("http-status");
const axios = require("axios");
const catchAsync = require("../utils/catchAsync");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const { tokenService } = require("../services");

const { ptToken } = config.jwt;
const primeTrustUrl = config.primeTrust.url;

const register = catchAsync(async (req, res) => {
  // if (await User.isEmailTaken(req.body.email)) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  // }

  if (await User.isUserNameTaken(req.body.userName)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username already taken");
  }

  const data = {
    type: "account",
    attributes: {
      "account-type": "custodial",
      name: req.body.userName,
      "authorized-signature": `${req.body.firstName} ${req.body.lastName}`,
      owner: {
        "contact-type": "natural_person",
        name: `${req.body.firstName} ${req.body.lastName}`,
        email: req.body.email,
        "date-of-birth": req.body.birthday,
        "tax-id-number": req.body.taxIdNum,
        "tax-country": req.body.taxCountry,
        "primary-phone-number": {
          country: req.body.country,
          number: req.body.phone,
          sms: true,
        },
        "primary-address": {
          "street-1": req.body.street1,
          "street-2": req.body.street2,
          "postal-code": req.body.postalCode,
          city: req.body.city,
          region: req.body.region,
          country: req.body.taxCountry,
        },
      },
    },
  };

  await axios({
    method: "POST",
    headers: { Authorization: ptToken },
    data: {
      data,
    },
    url: `${primeTrustUrl}/v2/accounts?include=owners,contacts,webhook-config`,
  })
    .then((response) => {
      console.log(
        "contactID",
        response.data.data.relationships.contacts.data[0].id
      );
      console.log("accountId", response.data.data.id);
      User.create({
        ...req.body,
        accountId: response.data.data.id,
        contactId: response.data.data.relationships.contacts.data[0].id,
      })
        .then((user) => {
          res.status(httpStatus.CREATED).send(user);
        })
        .catch((err) => {
          console.log(err);
          res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .send({ message: "Server Error" });
        });
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: err?.response?.data?.errors[0].detail });
    });
});

const getUserEmail = catchAsync(async (req, res) => {
  const { userName } = req.body;
  let currentUser = await User.findOne({ userName });
  if (!currentUser) {
    res.status(400).send({ message: "Unregistered User" });
    return;
  }
  res.send({
    email: currentUser.email,
    accountId: currentUser.accountId,
    contactId: currentUser.contactId,
  });
});

const unverifiedUser = catchAsync(async (req, res) => {
  const user = await User.find({ isVerified: false }).select(["accountId"]);
  res.send(user);
});

const login = catchAsync(async (req, res) => {
  const { userName, password } = req.body;
  const currentUser = await User.findOne({ userName });
  if (!currentUser || !(await currentUser.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  let verified = false;
  if (!currentUser.isVerified) {
    await axios({
      method: "GET",
      headers: { Authorization: ptToken },
      url: `${primeTrustUrl}/v2/accounts/${currentUser.accountId}`,
    })
      .then(async (res) => {
        if (res.data.data.attributes.status !== "opened") {
          console.log("account status", res.data.data.attributes.status);
        } else {
          verified = true;
          currentUser.isVerified = true;
          await currentUser.save();
        }
      })
      .catch((err) => {
        console.log("error", err.response.data?.errors);
      });
  } else {
    verified = true;
  }

  const token = await tokenService.generateAuthTokens(currentUser);

  if (!verified) {
    res.status(400).send({ message: "Your account is not opened." });
    return;
  }

  // we don't need complex login logic in this MVP version. because we are using only prime trust apis now.
  res.send({ currentUser, token });
});

module.exports = {
  register,
  login,
  getUserEmail,
  unverifiedUser,
};
