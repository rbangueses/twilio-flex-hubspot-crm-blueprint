import { useState, useEffect, useCallback } from "react";
import { Contact, Ticket, Note, Deal, Company } from "../types";
import * as api from "../api/hubspotClient";

interface HubSpotContactState {
  contact: Contact | null;
  tickets: Ticket[];
  notes: Note[];
  deals: Deal[];
  companies: Company[];
  loading: {
    contact: boolean;
    tickets: boolean;
    notes: boolean;
    deals: boolean;
    companies: boolean;
  };
  error: {
    contact: string | null;
    tickets: string | null;
    notes: string | null;
    deals: string | null;
    companies: string | null;
  };
}

export function useHubSpotContact(phone: string | null) {
  const [state, setState] = useState<HubSpotContactState>({
    contact: null,
    tickets: [],
    notes: [],
    deals: [],
    companies: [],
    loading: {
      contact: false,
      tickets: false,
      notes: false,
      deals: false,
      companies: false,
    },
    error: {
      contact: null,
      tickets: null,
      notes: null,
      deals: null,
      companies: null,
    },
  });

  const loadContact = useCallback(async (phoneNumber: string) => {
    setState((s) => ({
      ...s,
      loading: { ...s.loading, contact: true },
      error: { ...s.error, contact: null },
    }));

    try {
      const contact = await api.searchContact(phoneNumber);
      setState((s) => ({
        ...s,
        contact,
        loading: { ...s.loading, contact: false },
      }));
      return contact;
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: { ...s.loading, contact: false },
        error: { ...s.error, contact: "Failed to load contact" },
      }));
      return null;
    }
  }, []);

  const loadAssociatedData = useCallback(async (contactId: string) => {
    setState((s) => ({
      ...s,
      loading: {
        ...s.loading,
        tickets: true,
        notes: true,
        deals: true,
        companies: true,
      },
    }));

    const loadTickets = api.getTickets(contactId).then((tickets) => {
      setState((s) => ({
        ...s,
        tickets,
        loading: { ...s.loading, tickets: false },
      }));
    }).catch(() => {
      setState((s) => ({
        ...s,
        loading: { ...s.loading, tickets: false },
        error: { ...s.error, tickets: "Failed to load tickets" },
      }));
    });

    const loadNotes = api.getNotes(contactId).then((notes) => {
      setState((s) => ({
        ...s,
        notes,
        loading: { ...s.loading, notes: false },
      }));
    }).catch(() => {
      setState((s) => ({
        ...s,
        loading: { ...s.loading, notes: false },
        error: { ...s.error, notes: "Failed to load notes" },
      }));
    });

    const loadDeals = api.getDeals(contactId).then((deals) => {
      setState((s) => ({
        ...s,
        deals,
        loading: { ...s.loading, deals: false },
      }));
    }).catch(() => {
      setState((s) => ({
        ...s,
        loading: { ...s.loading, deals: false },
        error: { ...s.error, deals: "Failed to load deals" },
      }));
    });

    const loadCompanies = api.getCompanies(contactId).then((companies) => {
      setState((s) => ({
        ...s,
        companies,
        loading: { ...s.loading, companies: false },
      }));
    }).catch(() => {
      setState((s) => ({
        ...s,
        loading: { ...s.loading, companies: false },
        error: { ...s.error, companies: "Failed to load companies" },
      }));
    });

    await Promise.allSettled([loadTickets, loadNotes, loadDeals, loadCompanies]);
  }, []);

  useEffect(() => {
    if (!phone) return;

    loadContact(phone).then((contact) => {
      if (contact) {
        loadAssociatedData(contact.id);
      }
    });
  }, [phone, loadContact, loadAssociatedData]);

  const refreshTickets = useCallback(async () => {
    if (!state.contact) return;
    setState((s) => ({ ...s, loading: { ...s.loading, tickets: true } }));
    try {
      const tickets = await api.getTickets(state.contact.id);
      setState((s) => ({ ...s, tickets, loading: { ...s.loading, tickets: false } }));
    } catch {
      setState((s) => ({ ...s, loading: { ...s.loading, tickets: false } }));
    }
  }, [state.contact]);

  const refreshNotes = useCallback(async () => {
    if (!state.contact) return;
    setState((s) => ({ ...s, loading: { ...s.loading, notes: true } }));
    try {
      const notes = await api.getNotes(state.contact.id);
      setState((s) => ({ ...s, notes, loading: { ...s.loading, notes: false } }));
    } catch {
      setState((s) => ({ ...s, loading: { ...s.loading, notes: false } }));
    }
  }, [state.contact]);

  const refreshDeals = useCallback(async () => {
    if (!state.contact) return;
    setState((s) => ({ ...s, loading: { ...s.loading, deals: true } }));
    try {
      const deals = await api.getDeals(state.contact.id);
      setState((s) => ({ ...s, deals, loading: { ...s.loading, deals: false } }));
    } catch {
      setState((s) => ({ ...s, loading: { ...s.loading, deals: false } }));
    }
  }, [state.contact]);

  const refreshContact = useCallback(async () => {
    if (!phone) return;
    await loadContact(phone);
  }, [phone, loadContact]);

  return {
    ...state,
    refreshTickets,
    refreshNotes,
    refreshDeals,
    refreshContact,
  };
}
