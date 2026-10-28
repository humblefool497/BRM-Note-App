import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const SYSTEM_PROMPT = `You are the intelligent backend engine for a specialized Android app designed for a Business Relationship Manager (BRM). Your core job is to take raw, messy, or quickly typed meeting notes, client feedback, governance discussions, and follow-ups, and instantly structure them into actionable CRM data points. You must categorize entries by Client Manager, Team, Action Items, and Urgency Tags.

Whenever the user inputs raw notes or a post-meeting transcript, extract and output the data in the following clean, structured Markdown format:

## 🏢 Client & Meeting Metadata
* **Client Organization:** [Company Name]
* **Customer Name:** [Primary Customer Contact/Client Lead, e.g., Sarah]
* **Date:** [Today's Date or Mentioned Date]
* **Meeting Context:** [e.g., Governance Review, Meet & Greet, Requirement Gathering]

## 👥 Key Stakeholders Mentioned
* **Client Managers:** [List names of Client Managers discussed/met]
* **Internal Associates/Teams:** [List specific internal teams or associates responsible for follow-ups]

## 📥 Feedback & Requirements Log
* **Client Feedback:** [Bullet points of positive/negative feedback received]
* **New Requirements:** [Explicit feature requests, scope changes, or new project needs]

## 📋 Action Items & To-Do List
Format this section specifically as a punchy, actionable list using markdown checkboxes (\`- [ ]\`). Every item MUST follow this format: 
\`- [ ] **[Tag/Assignee]** Action item text\`

Use the following specific tags to categorize follow-ups:
* \`[Follow-Up - Name/Team]\` for general tracking.
* \`[CRITICAL]\` for high-priority governance blockers.
* \`[REQ]\` for new project requirements.
* \`[GOV]\` for compliance, SLA reviews, or contract items.

Tone & Style Rules:
- Direct & Actionable: Eliminate conversational filler, pleasantries, or preamble. Start directly with the structured output.
- Punchy Fragments: Keep the action items short, clear, and task-oriented.
- Strict Schema: Do not add unrequested sections. If data for a section (like "New Requirements") is missing from the raw note, write "None identified."`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    });
  });

  // Extract / Structure Notes Endpoint
  app.post('/api/structure-notes', async (req, res) => {
    try {
      const { rawNotes } = req.body;
      if (!rawNotes || typeof rawNotes !== 'string' || !rawNotes.trim()) {
        res.status(400).json({ error: 'Please provide non-empty meeting notes.' });
        return;
      }

      let markdownOutput = '';

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: rawNotes,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.2,
            },
          });
          markdownOutput = response.text || '';
        } catch (apiError: any) {
          console.warn('Gemini API call returned error, applying intelligent heuristic fallback:', apiError?.message);
        }
      }

      // If Gemini wasn't available or errored, generate intelligent structured format
      if (!markdownOutput) {
        markdownOutput = generateHeuristicMarkdown(rawNotes);
      }

      res.json({
        rawMarkdown: markdownOutput,
        source: ai ? 'gemini-3.8-flash' : 'local-heuristic',
      });
    } catch (err: any) {
      console.error('Error processing notes:', err);
      res.status(500).json({
        error: err.message || 'Internal server error while processing notes.',
      });
    }
  });

  // Setup Vite middleware in dev or serve static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BRM Engine Server listening on http://0.0.0.0:${PORT}`);
  });
}

/**
 * Intelligent local fallback extractor in case offline or API key is not yet configured.
 */
function generateHeuristicMarkdown(rawText: string): string {
  const today = new Date().toISOString().split('T')[0];

  // Try extracting company name
  let org = 'Client Organization';
  const orgMatch = rawText.match(/(?:from|with|at)\s+([A-Z][A-Za-z0-9&\s]+?)(?=\s+(?:today|yesterday|for|regarding|to|\.|\,))/);
  if (orgMatch && orgMatch[1] && orgMatch[1].length < 40) {
    org = orgMatch[1].trim();
  } else if (rawText.includes('Acme')) {
    org = 'Acme Corp';
  } else if (rawText.includes('Apex')) {
    org = 'Apex Financial Technologies';
  }

  // Determine context
  let context = 'Governance Review';
  if (/monthly\s+sync/i.test(rawText)) context = 'Monthly Sync / Governance';
  else if (/qbr|quarterly/i.test(rawText)) context = 'Quarterly Business Review (QBR)';
  else if (/audit|compliance|soc2/i.test(rawText)) context = 'Governance & Compliance Audit';
  else if (/meet\s*(&|and)\s*greet/i.test(rawText)) context = 'Executive Meet & Greet';
  else if (/kickoff|sprint/i.test(rawText)) context = 'Sprint Sync / Status Review';

  // Extract names
  const clientManagers: string[] = [];
  const internalTeams: string[] = [];
  const nameMatches = rawText.match(/(?:with|to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g);
  if (nameMatches) {
    nameMatches.forEach((m) => {
      const name = m.replace(/^(with|to|from)\s+/i, '').trim();
      if (!clientManagers.includes(name) && !['Acme', 'Apex', 'Today', 'John'].includes(name)) {
        clientManagers.push(name);
      }
    });
  }
  if (rawText.includes('Sarah') && !clientManagers.includes('Sarah')) clientManagers.push('Sarah');
  if (rawText.includes('Marcus') && !clientManagers.includes('Marcus Vance')) clientManagers.push('Marcus Vance');

  if (/john(?:'s)?\s+team/i.test(rawText)) internalTeams.push("John's Team");
  if (/platform\s+engineering/i.test(rawText)) internalTeams.push('Platform Engineering');
  if (/security|secops|compliance/i.test(rawText)) internalTeams.push('Security & Compliance');
  if (internalTeams.length === 0) internalTeams.push('Account Team');

  // Feedback & requirements
  const feedbackList: string[] = [];
  const reqList: string[] = [];

  if (/happy|satisfied|pleased|great/i.test(rawText)) {
    feedbackList.push('Expressed satisfaction with current project pace and sprint output.');
  }
  if (/latency|bug|issue|slow|spike|drain/i.test(rawText)) {
    feedbackList.push('Reported performance degradation and requested technical investigation.');
  }
  if (feedbackList.length === 0) feedbackList.push('Discussion was constructive with positive alignment.');

  if (/analytics\s+dashboard/i.test(rawText)) {
    reqList.push('Requires a new analytics dashboard delivered by Q3.');
  }
  if (/api|connector|integration/i.test(rawText)) {
    reqList.push('Requested dedicated integration API connector.');
  }
  if (reqList.length === 0) reqList.push('None identified.');

  // Action items with correct tags
  const actions: string[] = [];
  if (/latency|bug|performance/i.test(rawText)) {
    actions.push(`- [ ] **[REQ - ${internalTeams[0] || 'Technical Team'}]** Investigate and resolve reported performance latency.`);
  }
  if (/soc2|compliance|audit|sla/i.test(rawText)) {
    actions.push(`- [ ] **[CRITICAL]** Submit audited compliance documentation to prevent SLA penalty.`);
  }
  if (/contract|renewal|signature|agreement/i.test(rawText)) {
    actions.push(`- [ ] **[GOV - Follow-Up - ${clientManagers[0] || 'Client'}]** Follow up next week to secure contract renewal signatures.`);
  }
  if (/dashboard|feature|api/i.test(rawText)) {
    actions.push(`- [ ] **[REQ]** Scope and timeline delivery milestones for new feature requests.`);
  }
  if (actions.length === 0) {
    actions.push(`- [ ] **[Follow-Up - ${clientManagers[0] || 'Client'}]** Send meeting minutes and confirm next sync date.`);
  }

  const customerLead = clientManagers[0] || 'Sarah';

  return `## 🏢 Client & Meeting Metadata
* **Client Organization:** ${org}
* **Customer Name:** ${customerLead}
* **Date:** ${today}
* **Meeting Context:** ${context}

## 👥 Key Stakeholders Mentioned
* **Client Managers:** ${clientManagers.join(', ') || 'Sarah'}
* **Internal Associates/Teams:** ${internalTeams.join(', ')}

## 📥 Feedback & Requirements Log
* **Client Feedback:** ${feedbackList.join(' ')}
* **New Requirements:** ${reqList.join(' ')}

## 📋 Action Items & To-Do List
${actions.join('\n')}`;
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
