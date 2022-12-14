const httpStatus = require("http-status");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const axios = require("axios");
const util = require("util");
const config = require("../config/config");
const catchAsync = require("../utils/catchAsync");
const { plaid } = require("../config/config");

const prettyPrintResponse = (response) => {
  console.log(util.inspect(response.data, { colors: true, depth: 4 }));
};

const PLAID_HOST = config.plaid.apihost;
const PLAID_CLIENT_ID = config.plaid.clientId;
const PLAID_SECRET = config.plaid.secret;
const PLAID_ENV = config.plaid.plaidEnv;

// PLAID_PRODUCTS is a comma-separated list of products to use when initializing
// Link. Note that this list must contain 'assets' in order for the app to be
// able to create and retrieve asset reports.
const PLAID_PRODUCTS = (config.plaid.product || "transactions").split(",");

// PLAID_COUNTRY_CODES is a comma-separated list of countries for which users
// will be able to select institutions from.
const PLAID_COUNTRY_CODES = (config.plaid.countryCode || "US").split(",");

// Parameters used for the OAuth redirect Link flow.
//
// Set PLAID_REDIRECT_URI to 'http://localhost:3000'
// The OAuth redirect flow requires an endpoint on the developer's website
// that the bank website should redirect to. You will need to configure
// this redirect URI for your client ID through the Plaid developer dashboard
// at https://dashboard.plaid.com/team/api.
const PLAID_REDIRECT_URI = config.plaid.redirectUri || "";

// Parameter used for OAuth in Android. This should be the package name of your app,
// e.g. com.plaid.linksample
const PLAID_ANDROID_PACKAGE_NAME = config.plaid.androidPackageName || "";

// We store the access_token in memory - in production, store it in a secure
// persistent data store
let ACCESS_TOKEN = null;
let PUBLIC_TOKEN = null;
let ITEM_ID = null;
// The payment_id is only relevant for the UK Payment Initiation product.
// We store the payment_id in memory - in production, store it in a secure
// persistent data store
let PAYMENT_ID = null;
// The transfer_id is only relevant for Transfer ACH product.
// We store the transfer_id in memory - in production, store it in a secure
// persistent data store
let TRANSFER_ID = null;

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const client = new PlaidApi(configuration);

const createLinkToken = catchAsync(async (req, res, next) => {
  await axios({
    method: "POST",
    data: {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: req.sessionID,
      },
      client_name: "OroCash",
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: "en",
    },
    url: `${PLAID_HOST}/link/token/create`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err.response?.data.error_message);
      res.status(400).send({ msg: err.response?.data.error_message });
    });
});

const exchangePublicToken = catchAsync(async (req, res) => {
  await axios({
    method: "POST",
    data: {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      public_token: req.body.public_token,
    },
    url: `${PLAID_HOST}/item/public_token/exchange`,
  })
    .then((response) => {
      console.log("response", response.data);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("error", err.response?.data.error_message);
      res.status(400).send({ msg: err.response?.data.error_message });
    });
});

const setProcessorToken = catchAsync(async (req, res) => {
  const { account_id, public_token, institution_id } = req.body;
  // we have to uncomment this
  // const tokenResponse = await axios({
  //   method: "POST",
  //   data: {
  //     client_id: PLAID_CLIENT_ID,
  //     secret: PLAID_SECRET,
  //     public_token,
  //   },
  //   url: `${PLAID_HOST}/item/public_token/exchange`,
  // });
  // const accessToken = tokenResponse.data.access_token;
  // console.log(accessToken);

  // we have to use /processor/token/create endpoint in real production
  const processorTokenResponse = await axios({
    method: "POST",
    data: {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      institution_id,
      options: {
        // webhook: "https://www.genericwebhookurl.com/webhook",
        override_username: "user_good",
        override_password: "pass_good",
      },
    },
    url: `${PLAID_HOST}/sandbox/processor_token/create`,
  });

  // const processorTokenResponse = await axios({
  //   method: "POST",
  //   data: {
  //     client_id: PLAID_CLIENT_ID,
  //     secret: PLAID_SECRET,
  //     access_token: accessToken,
  //     account_id,
  //     processor: "wyre",
  //   },
  //   url: `${PLAID_HOST}/processor/token/create`,
  // }).then(result=>console.log(result)).catch(err=>console.log(err));
  // console.log(processorTokenResponse);
  res.send(processorTokenResponse.data);
});

const getBalance = catchAsync(async (req, res) => {
  const access_token = req.body.access_token;
  const balanceResponse = await client.accountsBalanceGet({ access_token });
  res.json({
    Balance: balanceResponse.data,
  });
});

module.exports = {
  createLinkToken,
  setProcessorToken,
  exchangePublicToken,
  getBalance,
};
