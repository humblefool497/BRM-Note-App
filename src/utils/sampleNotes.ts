export interface SampleNote {
  id: string;
  title: string;
  client: string;
  context: string;
  rawText: string;
}

export const SAMPLE_NOTES: SampleNote[] = [
  {
    id: 'sample-acme',
    title: 'Acme Corp - Sprint Sync & Renewal',
    client: 'Acme Corp',
    context: 'Monthly Sync / Governance',
    rawText: `Met with Sarah from Acme Corp today for the monthly sync. She's happy with current sprint speed but requested an analytics dashboard by Q3. John's team needs to look into the latency issues she reported. Need to follow up with Sarah next week about contract renewal signatures.`
  },
  {
    id: 'sample-apex-fintech',
    title: 'Apex Financial - SOC2 & SLA Blocker',
    client: 'Apex Financial Technologies',
    context: 'Governance Review & Audit Compliance',
    rawText: `Urgent governance review with Marcus Vance (VP Tech) and Elena Rostova (Director of SecOps) from Apex Financial. They raised a red flag regarding our latency spikes during market close on Oct 24th, threatening our 99.95% SLA credits. Elena mandated that our Security & Compliance team submit our audited SOC2 Type II report by Friday. Dave from Platform Engineering must schedule an architectural post-mortem with Marcus before Thursday noon. Marcus also stated they want to add AI-based transaction anomaly detection to their tier-1 agreement starting next fiscal quarter. Send revised SLA addendum to Elena for formal legal signoff.`
  },
  {
    id: 'sample-healthfirst',
    title: 'HealthFirst Care - QBR & EHR Integration',
    client: 'HealthFirst Healthcare Systems',
    context: 'Quarterly Business Review (QBR)',
    rawText: `Conducted Q3 QBR with Dr. Aris Thorne (Chief Medical Officer) and Priya Patel (VP Informatics). Overall sentiment is very strong; clinical adoption has climbed 34% this quarter. Priya requested a dedicated HL7 / FHIR data connector API before the November clinic rollout. Internal integrations squad (Lead: Alex Chen) needs to scope API workload by Wednesday. Follow up with Dr. Thorne regarding patient privacy questionnaire approval. Need to review mutual indemnification clause with our legal team prior to contract expansion.`
  },
  {
    id: 'sample-logistics-nexus',
    title: 'Nexus Logistics - Fleet IoT Rollout',
    client: 'Nexus Global Logistics',
    context: 'Implementation Review & Scope Expansion',
    rawText: `Met with Carlos Mendez (Head of Fleet Operations) and Rachel Zane (Procurement). Carlos reported that the beta geofencing telemetry works well across Midwest depots, but battery drain on handheld scanners is a major concern for field drivers. Hardware Support team must test low-power firmware patch by Tuesday. Rachel is preparing the multi-year master service agreement, but requires a 12% enterprise tier discount approval from executive leadership. Schedule budget alignment call with Rachel and Finance next Monday.`
  }
];
