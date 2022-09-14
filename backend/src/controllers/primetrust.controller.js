const httpStatus = require("http-status");
const { uuid } = require("uuidv4");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const catchAsync = require("../utils/catchAsync");
const { User } = require("../models");
const config = require("../config/config");
const { deserializeUser } = require("passport");

const { ptToken } = config.jwt;
const primeTrustUrl = config.primeTrust.url;

const createUser = catchAsync(async (req, res) => {
  const { email, name, password } = req.body;
  await axios({
    method: "POST",
    data: {
      data: {
        type: "user",
        attributes: {
          email,
          name,
          password,
        },
      },
    },
    url: `${primeTrustUrl}/v2/users`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors[0]?.title);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

const createJwt = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  await axios({
    method: "POST",
    params: {
      email,
      password,
    },
    url: `${primeTrustUrl}/auth/jwts`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors[0]?.title);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

const getAccounts = catchAsync(async (req, res) => {
  console.log(req.headers.authorization);
  await axios({
    method: "GET",
    headers: { Authorization: ptToken },
    url: `${primeTrustUrl}/v2/accounts?filter[status]=opened`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors[0]?.title);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

const setAccount = catchAsync(async (req, res) => {
  const { accountId, userName } = req.body;
  await axios({
    method: "GET",
    headers: { Authorization: ptToken },
    url: `${primeTrustUrl}/v2/users`,
  })
    .then(async (response) => {
      const email = response.data.data[0].attributes.email;
      let currentUser = await User.findOne({ userName });

      if (!currentUser) {
        res.status(400).send({ message: "User is not existed" });
        return;
      }

      if (email != currentUser.email) {
        res.status(400).send({ message: "Invalid user" });
        return;
      }
      console.log(currentUser);
      currentUser.accountId = accountId;
      const newUser = await currentUser.save();
      console.log(newUser);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

const createIndividualAccount = catchAsync(async (req, res) => {
  await axios({
    method: "POST",
    headers: { Authorization: ptToken },
    data: {
      data: {
        type: "account",
        attributes: {
          "account-type": "custodial",
          name: "Dragon Account",
          "authorized-signature": "John Connor",
          owner: {
            "contact-type": "natural_person",
            name: "John Connor",
            email: "blackhole.rsb@gmail.com",
            "date-of-birth": "1971-01-01",
            "tax-id-number": "111223333",
            "tax-country": "US",
            geolocation: "+40.6894-074.0447",
            "ip-address": "2001:db8:3333:4444:5555:6666:7777:8888",
            "primary-phone-number": {
              country: "US",
              number: "123456789",
              sms: true,
            },
            "primary-address": {
              "street-1": "NaKaKu",
              "street-2": "Apt 260",
              "postal-code": "89145",
              city: "Las Vegas",
              region: "NV",
              country: "US",
            },
          },
        },
      },
    },
    url: `${primeTrustUrl}/v2/accounts?include=owners,contacts,webhook-config`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

const uploadDocuments = catchAsync(async (req, res) => {
  if (!req.file) {
    res.status(400).send({ message: "Please upload a file" });
    return;
  }

  const user = await User.findOne({ _id: req.body.userId });
  if (!user) {
    res.status(400).send({ message: "Invalid User." });
    return;
  }
  console.log(user);
  const { type } = req.body;
  let label = "";
  let description = "";
  switch (type) {
    case "driverBack":
      label = "Back of Driver's License";
      description = "Backside Driver's License";
      break;
    case "driverFront":
      label = "Front of Driver's License";
      description = "Frontside Driver's License";
      break;
    case "governmentId":
      label = "Government ID";
      description = "Government ID";
      break;
    case "passport":
      label = "Passport";
      description = "Passport";
      break;
    case "residencePermitFront":
      label = "Front of Residence Permit";
      description = "Frontside Residence Permit";
      break;
    case "residencePermitBack":
      label = "Back of Residence Permit";
      description = "Backside Residence Permit";
      break;
    case "utilityBill":
      label = "Utility Bill";
      description = "Utility Bill";
      break;
  }
  const uploadedFile = fs.createReadStream(req.file.path);
  const uploadedInfo = new FormData();
  uploadedInfo.append("file", uploadedFile);
  uploadedInfo.append("contact-id", user.contactId);
  uploadedInfo.append("description", description);
  uploadedInfo.append("label", label);
  uploadedInfo.append("public", "true");
  // console.log(uploadedFile);
  await axios({
    method: "POST",
    headers: {
      Authorization: ptToken,
    },
    data: uploadedInfo,
    url: `${primeTrustUrl}/v2/uploaded-documents`,
  })
    .then((response) => {
      // console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err.response?.data?.errors);
      res.status(400).send({ message: err.response?.data?.errors[0]?.detail });
    });
});

const agreementPreviews = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  await axios({
    method: "POST",
    params: {
      email,
      password,
    },
    url: `${primeTrustUrl}/auth/jwts`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors[0]?.title);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

const accountPolicy = catchAsync(async (req, res) => {
  await axios({
    method: "GET",
    headers: {
      authorization: ptToken,
    },
    url: `${primeTrustUrl}/v2/account-aggregate-policies`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors[0]?.title);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

const createResourceTokens = catchAsync(async (req, res) => {
  const { resourceId } = req.body;
  await axios({
    method: "POST",
    data: {
      data: {
        type: "resource-tokens",
        attributes: {
          "resource-id": resourceId,
          "resource-type": "user",
          "resource-token-type": "create_account",
        },
      },
    },
    url: `${primeTrustUrl}/v2/resource-tokens`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors[0]?.title);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

const getResourceTokens = catchAsync(async (req, res) => {
  await axios({
    method: "GET",
    url: `${primeTrustUrl}/v2/resource-tokens`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors[0]?.title);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

const depositFund = catchAsync(async (req, res) => {
  let fundsTransferMethodId = "";
  await axios({
    method: "POST",
    headers: {
      Authorization: ptToken,
    },
    data: {
      data: {
        type: "funds-transfer-methods",
        attributes: {
          "contact-id": req.user.contactId,
          "bank-account-name": req.body.bankAccountName,
          "routing-number": req.body.routingNumber,
          "bank-account-type": "checking",
          "bank-account-number": req.body.bankAccountNumber,
          "ach-check-type": "personal",
          "funds-transfer-type": "ach",
        },
      },
    },
    url: `${primeTrustUrl}/v2/funds-transfer-methods`,
  })
    .then(async (response) => {
      console.log(req.user.accountId);
      fundsTransferMethodId = response.data.data.id;
      await axios({
        method: "POST",
        headers: {
          Authorization: ptToken,
        },
        data: {
          data: {
            type: "contributions",
            attributes: {
              amount: req.body.amount,
              "contact-id": req.user.contactId,
              "funds-transfer-method-id": fundsTransferMethodId,
              "account-id": req.user.accountId,
            },
          },
        },
        url: `${primeTrustUrl}/v2/contributions?include=funds-transfer`,
      }).then(async (resp1) => {
        res.send(resp1.data);
        //settle deposit -- we have to remove this in real production
        await axios({
          method: "POST",
          headers: {
            Authorization: ptToken,
          },
          url: `${primeTrustUrl}/v2/funds-transfers/${resp1.data.included[0].id}/sandbox/settle`,
        });
      });
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors);
      res.status(400).send({ message: err.response?.data?.errors[0]?.detail });
    });
});

const getFundBalance = catchAsync(async (req, res) => {
  await axios({
    method: "GET",
    headers: {
      Authorization: ptToken,
    },
    url: `${primeTrustUrl}/v2/account-cash-totals?account.id=${req.user.accountId}`,
  })
    .then((response) => {
      res.send({ amount: response.data.data[0].attributes.settled });
    })
    .catch((err) => {
      console.log("error", err?.response?.data?.errors[0]?.title);
      res.status(400).send({ message: err.response?.data?.errors[0]?.title });
    });
});

module.exports = {
  createUser,
  createJwt,
  getAccounts,
  setAccount,
  createIndividualAccount,
  uploadDocuments,
  accountPolicy,
  agreementPreviews,
  createResourceTokens,
  getResourceTokens,
  depositFund,
  getFundBalance,
};
