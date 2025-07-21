const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { note } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `
You are an expert medical coding assistant specializing in outpatient (clinic/office) coding. Analyze the following **structured clinical note** and extract the relevant medical codes and billing information with explanations, following these requirements:

1. ICD-10-CM Diagnosis Codes  
- Code only confirmed diagnoses. Do not code “probable,” “suspected,” “rule out,” etc.  
- If no definitive diagnosis is given, code symptoms or findings instead.  
- List the primary diagnosis first, followed by any evaluated chronic or secondary conditions.  
- Use Z-codes for historical or status conditions if they impact care.  
- BMI, ulcer stage, coma score, etc. may be coded based on non-provider documentation if linked.  
- Use O-codes for pregnancy complications; use Z33.1 if pregnancy is incidental.  
- Use Z51.0/Z51.11 for encounters primarily for radiation or chemotherapy.

2. CPT/HCPCS Procedure Codes  
- Assign the correct E/M office visit code (99202–99215), based on MDM or time.  
- Include CPT codes for any additional services (e.g., ECG, lab tests, injections, joint injections, screenings).  
- If drugs or DME were administered or supplied, add appropriate HCPCS Level II (e.g., J-codes).  
- Each CPT/HCPCS code must include a short justification from the chart.

3. Justification and References  
- After every code, include a brief justification based on the note content.  
Example:  
• ICD-10: J45.909 – Unspecified asthma, uncomplicated (Justification: Wheezing noted in exam; nebulizer given)  
• CPT: 99213 – Office visit, level 3 (Justification: Moderate MDM, multiple issues reviewed and medication managed)

4. Bundling and Modifier Rules  
- Apply NCCI edits. Do not unbundle services unless modifier use is justified.  
- Add **modifier -25** if a significant E/M was done on the same day as a minor procedure.  
- Add **modifier -59** for distinct procedural services if justified.  
- Other modifiers: -LT/-RT for laterality, -24 for unrelated E/M in post-op period, -57 for decision for surgery, etc.  
- Only use modifiers that are applicable to the documented scenario.  
- Flag any payer watch-outs (e.g., “Medicare requires prior auth” or “global period applies”).

5. Specialty-Specific Considerations  
- For **Preventive Visits**: Use CPT 99381–99397 + Z00.00/Z00.01. Add -25 if problem E/M is also performed.  
- For **Pediatrics**: Include both vaccine product codes and admin CPTs; use Z00.12-Z00.129 for well child.  
- For **OB/GYN**: Pregnancy care uses O-codes or Z34.xx for normal pregnancy; Z39.2 for postpartum.  
- For **Mental Health**: Use 90832–90838 for psychotherapy; include CPT 96127 if screenings performed.  
- For **Ortho/Surgery**: Include DME codes if crutches/splints given. Use -RT/-LT. Don’t double-report fracture care.  
- For **In-office labs or diagnostics**: Code tests performed and interpreted in visit (e.g., rapid strep, urinalysis, EKG).

6. Output Format  
📌 ICD-10: <code> – <description>  
Justification: …

📌 CPT: <code> – <description>  
Justification: …

📌 Modifier(s): -25, -59, etc.  
Justification: …

📌 Billing Notes: (if needed)  
- Explanation of bundling, modifiers, or payer policies  
- Short and professional

⚠️ If the chart lacks necessary elements (no diagnosis, plan, procedures, or symptoms), respond:
"⚠️ Chart is insufficient for confident coding."

Now process the following chart:

Clinical Note:
${note}
`;

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
    console.log('🔍 OpenAI raw response:', JSON.stringify(data, null, 2));

    const output = data.choices?.[0]?.message?.content?.trim() || '⚠️ No codes returned.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes: output })
    };

  } catch (err) {
    console.error('❌ OpenAI API error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to contact OpenAI.' })
    };
  }
};
