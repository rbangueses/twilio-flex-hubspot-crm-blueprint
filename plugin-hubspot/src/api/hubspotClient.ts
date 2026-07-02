import { Contact, Ticket, Note, Deal, Company, Activity } from "../types";

declare global {
  interface Window {
    appConfig?: {
      FLEX_APP_FUNCTIONS_BASE_URL?: string;
      HUBSPOT_PORTAL_ID?: string;
      HUBSPOT_REGION?: string;
    };
  }
}

const FUNCTIONS_BASE_URL =
  process.env.REACT_APP_FUNCTIONS_BASE_URL ||
  window.appConfig?.FLEX_APP_FUNCTIONS_BASE_URL ||
  "";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function searchContact(phone: string): Promise<Contact | null> {
  try {
    return await fetchJson<Contact>(
      `${FUNCTIONS_BASE_URL}/contact/search?phone=${encodeURIComponent(phone)}`
    );
  } catch (error) {
    if ((error as Error).message.includes("404")) {
      return null;
    }
    throw error;
  }
}

export async function createContact(data: {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone: string;
}): Promise<Contact> {
  return fetchJson<Contact>(`${FUNCTIONS_BASE_URL}/contact/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateContact(
  contactId: string,
  data: Partial<Contact>
): Promise<Contact> {
  return fetchJson<Contact>(`${FUNCTIONS_BASE_URL}/contact/update`, {
    method: "POST",
    body: JSON.stringify({ contactId, ...data }),
  });
}

export async function getTickets(contactId: string): Promise<Ticket[]> {
  const response = await fetchJson<{ tickets: Ticket[] }>(
    `${FUNCTIONS_BASE_URL}/tickets?contactId=${contactId}`
  );
  return response.tickets;
}

export async function createTicket(data: {
  contactId: string;
  subject: string;
  content?: string;
  hs_pipeline_stage?: string;
  hs_ticket_priority?: string;
}): Promise<Ticket> {
  return fetchJson<Ticket>(`${FUNCTIONS_BASE_URL}/tickets`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTicket(data: {
  ticketId: string;
  hs_pipeline_stage?: string;
  hs_ticket_priority?: string;
  content?: string;
}): Promise<Ticket> {
  return fetchJson<Ticket>(`${FUNCTIONS_BASE_URL}/tickets`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getNotes(contactId: string): Promise<Note[]> {
  const response = await fetchJson<{ notes: Note[] }>(
    `${FUNCTIONS_BASE_URL}/notes?contactId=${contactId}`
  );
  return response.notes;
}

export async function createNote(data: {
  contactId: string;
  body: string;
}): Promise<Note> {
  return fetchJson<Note>(`${FUNCTIONS_BASE_URL}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`${FUNCTIONS_BASE_URL}/notes`, {
    method: "POST",
    body: JSON.stringify({ noteId }),
  });
}

export async function getDeals(contactId: string): Promise<Deal[]> {
  const response = await fetchJson<{ deals: Deal[] }>(
    `${FUNCTIONS_BASE_URL}/deals?contactId=${contactId}`
  );
  return response.deals;
}

export async function createDeal(data: {
  contactId: string;
  dealname: string;
  amount?: string;
  dealstage?: string;
}): Promise<Deal> {
  return fetchJson<Deal>(`${FUNCTIONS_BASE_URL}/deals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDeal(data: {
  dealId: string;
  dealname?: string;
  amount?: string;
  dealstage?: string;
  closedate?: string;
}): Promise<Deal> {
  return fetchJson<Deal>(`${FUNCTIONS_BASE_URL}/deals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCompanies(contactId: string): Promise<Company[]> {
  const response = await fetchJson<{ companies: Company[] }>(
    `${FUNCTIONS_BASE_URL}/companies?contactId=${contactId}`
  );
  return response.companies;
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const response = await fetchJson<{ contacts: Contact[] }>(
    `${FUNCTIONS_BASE_URL}/search?query=${encodeURIComponent(query)}&type=contacts`
  );
  return response.contacts;
}

export async function listAllTickets(status: "open" | "closed" | "all" = "open"): Promise<Ticket[]> {
  const response = await fetchJson<{ tickets: Ticket[] }>(
    `${FUNCTIONS_BASE_URL}/tickets/list?status=${status}`
  );
  return response.tickets;
}

export async function listAllDeals(status: "open" | "closed" | "all" = "open"): Promise<Deal[]> {
  const response = await fetchJson<{ deals: Deal[] }>(
    `${FUNCTIONS_BASE_URL}/deals/list?status=${status}`
  );
  return response.deals;
}

export async function getActivities(contactId: string): Promise<Activity[]> {
  const response = await fetchJson<{ activities: Activity[] }>(
    `${FUNCTIONS_BASE_URL}/calls?contactId=${contactId}`
  );
  return response.activities;
}

export async function logCall(data: {
  contactId: string;
  body: string;
  direction?: string;
  duration?: string;
}): Promise<Activity> {
  return fetchJson<Activity>(`${FUNCTIONS_BASE_URL}/calls`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteActivity(activityId: string, activityType: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`${FUNCTIONS_BASE_URL}/calls`, {
    method: "POST",
    body: JSON.stringify({ activityId, activityType }),
  });
}
