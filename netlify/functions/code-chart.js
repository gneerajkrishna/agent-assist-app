exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  const body = JSON.parse(event.body);

  const response = `
📌 ICD-10: I10 – Hypertension
Justification: Based on provided chart.

📌 CPT: 99214 – Office Visit
Justification: Chronic condition management.
  `;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' }, // ✅ Add this line
    body: JSON.stringify({ codes: response }),
  };
};

