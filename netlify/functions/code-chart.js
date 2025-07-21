const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { note } = JSON.parse(event.body);
  const apiKey = process.env.OPENAI_API_KEY;

  const prompt = `
You are a certified US medical coding assistant focused on outpatient documentation. Given a patient chart, extract:

- Accurate ICD-10-CM diagnosis codes
- CPT codes for procedures and services
- Justifications (1–2 lines) for each code
- Do not include any PHI in your response

If a chart lacks sufficient detail, return a message like: “⚠️ Chart is insufficient for confident coding.”

Return format:
📌 ICD-10: <code> – <desc>
Justification: ...

📌 CPT: <code> – <desc>
Justification: ...

Chart Note:
${note}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a medical coder.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || '⚠️ No codes returned.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes: output })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to contact OpenAI.' })
    };
  }
};

