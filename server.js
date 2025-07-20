const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(__dirname));
app.use(express.json());

app.post('/api/code-chart', (req, res) => {
  const { note } = req.body;
  const mock = `
📌 ICD-10: I10 – Hypertension
Justification: Diagnosis mentioned in the note.

📌 CPT: 99214 – Office Visit
Justification: Chronic condition with moderate complexity.
  `;
  res.json({ codes: mock });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
