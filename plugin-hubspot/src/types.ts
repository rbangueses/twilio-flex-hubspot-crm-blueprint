export interface Contact {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  company: string;
  jobtitle: string;
  lifecyclestage: string;
  hubspot_owner_id: string;
  hs_lead_status: string;
  lastmodifieddate: string;
}

export interface Ticket {
  id: string;
  subject: string;
  content: string;
  hs_pipeline_stage: string;
  hs_ticket_priority: string;
  createdate: string;
  hs_lastmodifieddate: string;
}

export interface Note {
  id: string;
  body: string;
  timestamp: string;
  lastmodifieddate: string;
}

export interface Deal {
  id: string;
  dealname: string;
  amount: string;
  dealstage: string;
  createdate: string;
  closedate: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  phone: string;
  city: string;
  country: string;
}

export interface Activity {
  id: string;
  type: "call" | "note" | "email";
  body: string;
  timestamp: string;
  direction?: string;
  duration?: string;
  subject?: string;
}
