const axios = require('axios');

// Reuse the same token logic
let accessToken = null;
let tokenExpiry = 0;

async function getToken() {
  const now = Date.now();

  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  const res = await axios.post(
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

  accessToken = res.data.access_token;
  tokenExpiry = now + res.data.expires_in * 1000 - 5000;

  return accessToken;
}

exports.handler = async function (event, context) {
  try {
    const token = await getToken();

    const patientId = 28005; // Athena 1 — sample sandbox patient
    const response = await axios.get(
      `https://api.preview.platform.athenahealth.com/fhir/r4/Patient/${patientId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/fhir+json'
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.response?.data || error.message })
    };
  }
};
