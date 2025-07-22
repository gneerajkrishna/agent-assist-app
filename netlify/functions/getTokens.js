// netlify/functions/getToken.js
const axios = require('axios');

let accessToken = null;
let tokenExpiry = 0;

exports.handler = async function (event, context) {
  const now = Date.now();

  // Reuse if still valid
  if (accessToken && now < tokenExpiry) {
    return {
      statusCode: 200,
      body: JSON.stringify({ access_token: accessToken })
    };
  }

  // Fetch new token
  try {
    const tokenRes = await axios.post(
      'https://api.preview.platform.athenahealth.com/oauth2/v1/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.ATHENA_CLIENT_ID,
        client_secret: process.env.ATHENA_CLIENT_SECRET,
        scope: 'athena/service/Athenanet.MDP.*'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    accessToken = tokenRes.data.access_token;
    tokenExpiry = now + tokenRes.data.expires_in * 1000 - 5000; // small buffer

    return {
      statusCode: 200,
      body: JSON.stringify({ access_token: accessToken })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.response?.data || error.message })
    };
  }
};
