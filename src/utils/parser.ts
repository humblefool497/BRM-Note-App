import { ActionItem, ParsedCrmData, parseTagType } from '../types/crm';

/**
 * Parses strict BRM Markdown schema into structured CRM data.
 */
export function parseBrmMarkdown(markdown: string, rawNotes = ''): ParsedCrmData {
  let clientOrganization = '';
  let customerName = '';
  let meetingDate = '';
  let meetingContext = '';
  const clientManagers: string[] = [];
  const internalTeams: string[] = [];
  const clientFeedback: string[] = [];
  const newRequirements: string[] = [];
  const actionItems: ActionItem[] = [];

  const lines = markdown.split('\n');
  let currentSection = '';

  const checkboxRegex = /^(?:[\*\-]\s*)?\[([ xX])\]\s*\*\*\[(.*?)\]\*\*\s*(.*)$/;
  const altCheckboxRegex = /^(?:[\*\-]\s*)?\[([ xX])\]\s*\[(.*?)\]\s*(.*)$/;
  const bareTagRegex = /^(?:[\*\-]\s*)?\*\*\[(.*?)\]\*\*\s*(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line.startsWith('## ')) {
      currentSection = line.toLowerCase();
      continue;
    }

    // Client & Meeting Metadata
    if (line.includes('**Client Organization:**')) {
      const match = line.split('**Client Organization:**')[1];
      if (match) clientOrganization = cleanValue(match);
      continue;
    }
    if (line.includes('**Customer Name:**')) {
      const match = line.split('**Customer Name:**')[1];
      if (match) customerName = cleanValue(match);
      continue;
    }
    if (line.includes('**Date:**')) {
      const match = line.split('**Date:**')[1];
      if (match) meetingDate = cleanValue(match);
      continue;
    }
    if (line.includes('**Meeting Context:**')) {
      const match = line.split('**Meeting Context:**')[1];
      if (match) meetingContext = cleanValue(match);
      continue;
    }

    // Key Stakeholders Mentioned
    if (line.includes('**Client Managers:**')) {
      const match = line.split('**Client Managers:**')[1];
      if (match) {
        splitCsv(match).forEach((name) => {
          if (name && name !== 'None identified.' && name !== 'None') {
            clientManagers.push(name);
          }
        });
      }
      continue;
    }
    if (line.includes('**Internal Associates/Teams:**')) {
      const match = line.split('**Internal Associates/Teams:**')[1];
      if (match) {
        splitCsv(match).forEach((team) => {
          if (team && team !== 'None identified.' && team !== 'None') {
            internalTeams.push(team);
          }
        });
      }
      continue;
    }

    // Feedback & Requirements Log
    if (line.includes('**Client Feedback:**')) {
      const rest = line.split('**Client Feedback:**')[1];
      if (rest) {
        const val = cleanValue(rest);
        if (val && val !== 'None identified.' && val !== 'None') {
          clientFeedback.push(val);
        }
      }
      continue;
    }
    if (line.includes('**New Requirements:**')) {
      const rest = line.split('**New Requirements:**')[1];
      if (rest) {
        const val = cleanValue(rest);
        if (val && val !== 'None identified.' && val !== 'None') {
          newRequirements.push(val);
        }
      }
      continue;
    }

    // Secondary lines under Feedback & Requirements
    if (currentSection.includes('feedback') || currentSection.includes('requirements')) {
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const bulletText = cleanValue(line.replace(/^[\*\-]\s*/, ''));
        if (bulletText && !bulletText.startsWith('**') && bulletText !== 'None identified.') {
          clientFeedback.push(bulletText);
        }
      }
    }

    // Action items
    const checkMatch = line.match(checkboxRegex) || line.match(altCheckboxRegex);
    if (checkMatch) {
      const isDone = checkMatch[1].toLowerCase() === 'x';
      const tag = checkMatch[2].trim();
      const task = checkMatch[3].trim();
      actionItems.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tag,
        task,
        isDone,
        tagType: parseTagType(tag),
      });
      continue;
    }

    const bareMatch = line.match(bareTagRegex);
    if (bareMatch && currentSection.includes('action')) {
      const tag = bareMatch[1].trim();
      const task = bareMatch[2].trim();
      actionItems.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tag,
        task,
        isDone: false,
        tagType: parseTagType(tag),
      });
    }
  }

  // Fallback defaults if missing
  const finalCustomerName = customerName || (clientManagers.length > 0 ? clientManagers[0] : 'Sarah');

  return {
    id: `crm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    clientOrganization: clientOrganization || 'Acme Corp',
    customerName: finalCustomerName,
    meetingDate: meetingDate || new Date().toISOString().split('T')[0],
    meetingContext: meetingContext || 'Governance Review',
    clientManagers: clientManagers.length > 0 ? clientManagers : ['Sarah'],
    internalTeams: internalTeams.length > 0 ? internalTeams : ['Account Team'],
    clientFeedback: clientFeedback.length > 0 ? clientFeedback : ['Overall positive discussion.'],
    newRequirements: newRequirements.length > 0 ? newRequirements : ['None identified.'],
    actionItems,
    rawNotes,
    rawMarkdown: markdown,
  };
}

function cleanValue(str: string): string {
  let val = str.replace(/^[:\s\-*]+/, '').replace(/[\s\*]+$/, '').trim();
  // Strip inadvertent 'X from Y' -> 'Y' if detected
  const fromMatch = val.match(/(?:from\s+)(.+)$/i);
  if (fromMatch && fromMatch[1]) {
    val = fromMatch[1].trim();
  }
  return val;
}

function splitCsv(str: string): string[] {
  return str
    .split(/[,;\n]/)
    .map((s) => cleanValue(s))
    .filter((s) => s.length > 0);
}

/**
 * Builds the exact Markdown schema defined in the user's specification.
 */
export function buildBrmMarkdown(data: ParsedCrmData): string {
  const managersStr = data.clientManagers.length > 0 ? data.clientManagers.join(', ') : 'None identified.';
  const teamsStr = data.internalTeams.length > 0 ? data.internalTeams.join(', ') : 'None identified.';
  
  const feedbackStr = data.clientFeedback.length > 0 
    ? data.clientFeedback.join('; ')
    : 'None identified.';
  
  const reqStr = data.newRequirements.length > 0 
    ? data.newRequirements.join('; ')
    : 'None identified.';

  const actionLines = data.actionItems.length > 0
    ? data.actionItems.map((item) => `- [${item.isDone ? 'x' : ' '}] **[${item.tag}]** ${item.task}`).join('\n')
    : '- [ ] **[Follow-Up]** No action items identified.';

  return `## 🏢 Client & Meeting Metadata
* **Client Organization:** ${data.clientOrganization}
* **Customer Name:** ${data.customerName || 'None identified.'}
* **Date:** ${data.meetingDate}
* **Meeting Context:** ${data.meetingContext}

## 👥 Key Stakeholders Mentioned
* **Client Managers:** ${managersStr}
* **Internal Associates/Teams:** ${teamsStr}

## 📥 Feedback & Requirements Log
* **Client Feedback:** ${feedbackStr}
* **New Requirements:** ${reqStr}

## 📋 Action Items & To-Do List
${actionLines}`;
}
