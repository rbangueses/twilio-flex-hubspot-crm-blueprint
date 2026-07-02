import { Box } from "@twilio-paste/core";
import { useHubSpotContact } from "../../hooks/useHubSpotContact";
import { ContactHeader } from "./ContactHeader";
import { TabContainer } from "./TabContainer";
import { DetailsTab } from "./DetailsTab";
import { TicketsTab } from "./TicketsTab";
import { NotesTab } from "./NotesTab";
import { DealsTab } from "./DealsTab";
import { QuickCreateContact } from "./QuickCreateContact";
import { Dashboard } from "./Dashboard";
import { LoadingState } from "../shared/LoadingState";
import { ErrorBanner } from "../shared/ErrorBanner";

interface HubSpotPanelProps {
  phone: string | null;
}

export function HubSpotPanel({ phone }: HubSpotPanelProps) {
  const {
    contact,
    tickets,
    notes,
    deals,
    companies,
    loading,
    error,
    refreshTickets,
    refreshNotes,
    refreshDeals,
    refreshContact,
  } = useHubSpotContact(phone);

  if (!phone) {
    return <Dashboard />;
  }

  if (loading.contact) {
    return <LoadingState variant="skeleton" />;
  }

  if (error.contact) {
    return <ErrorBanner message={error.contact} onRetry={refreshContact} />;
  }

  if (!contact) {
    return <QuickCreateContact phone={phone} onContactCreated={refreshContact} />;
  }

  const tabs = [
    {
      id: "details",
      label: "Details",
      content: <DetailsTab contact={contact} onContactUpdated={refreshContact} />,
    },
    {
      id: "tickets",
      label: "Tickets",
      count: tickets.length,
      loading: loading.tickets,
      content: (
        <TicketsTab
          contactId={contact.id}
          tickets={tickets}
          loading={loading.tickets}
          error={error.tickets}
          onRefresh={refreshTickets}
        />
      ),
    },
    {
      id: "notes",
      label: "Notes",
      count: notes.length,
      loading: loading.notes,
      content: (
        <NotesTab
          contactId={contact.id}
          notes={notes}
          loading={loading.notes}
          error={error.notes}
          onRefresh={refreshNotes}
        />
      ),
    },
    {
      id: "deals",
      label: "Deals",
      count: deals.length,
      loading: loading.deals,
      content: (
        <DealsTab
          contactId={contact.id}
          deals={deals}
          loading={loading.deals}
          error={error.deals}
          onRefresh={refreshDeals}
        />
      ),
    },
  ];

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <ContactHeader contact={contact} companies={companies} />
      <Box flex="1" overflow="auto">
        <TabContainer tabs={tabs} />
      </Box>
    </Box>
  );
}
