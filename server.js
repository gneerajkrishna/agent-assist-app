module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const response = `
📌 ICD-10: I10 – Hypertension
Justification: Based on provided chart description.

📌 CPT: 99214 – Office Visit, Moderate
Justification: Chronic condition management with medication adjustment.
      `;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ codes: response }));
    } catch (e) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid request format' }));
    }
  });
};
