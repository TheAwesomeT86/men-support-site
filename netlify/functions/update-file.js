// Netlify Function: update-file
// Updates a file in GitHub repo via API using a PAT. Protect with 4-digit PIN.

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const ADMIN_PIN = process.env.ADMIN_PIN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO; // e.g., TheAwesomeT86/MENS-site
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

    if (!ADMIN_PIN || !GITHUB_TOKEN || !GITHUB_REPO) {
      return { statusCode: 500, body: 'Server not configured' };
    }

    const pinHeader = event.headers['x-admin-pin'] || event.headers['X-Admin-Pin'];
    if (pinHeader !== ADMIN_PIN) {
      return { statusCode: 401, body: 'Invalid PIN' };
    }

    const { path, content } = JSON.parse(event.body || '{}');
    if (!path || typeof content !== 'string') {
      return { statusCode: 400, body: 'Missing path or content' };
    }

    const apiBase = 'https://api.github.com';
    const fileUrl = `${apiBase}/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

    // Get current file SHA (if exists)
    let sha = undefined;
    const getRes = await fetch(fileUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'netlify-fn' },
    });
    if (getRes.status === 200) {
      const json = await getRes.json();
      sha = json.sha;
    } else if (getRes.status !== 404) {
      const txt = await getRes.text();
      return { statusCode: 502, body: `GitHub read error: ${txt}` };
    }

    const putRes = await fetch(`${apiBase}/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'netlify-fn',
      },
      body: JSON.stringify({
        message: `Update ${path} via admin editor`,
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!putRes.ok) {
      const txt = await putRes.text();
      return { statusCode: 502, body: `GitHub write error: ${txt}` };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: `Server error: ${e.message}` };
  }
};
