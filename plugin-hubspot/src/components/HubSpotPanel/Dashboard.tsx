import { useState, useEffect } from "react";
import {
  Box,
  Text,
  Input,
  Button,
  Stack,
  Badge,
  Select,
  Option,
} from "@twilio-paste/core";
import { SearchIcon } from "@twilio-paste/icons/esm/SearchIcon";
import { CallOutgoingIcon } from "@twilio-paste/icons/esm/CallOutgoingIcon";
import { Actions } from "@twilio/flex-ui";
import { Contact, Ticket, Deal } from "../../types";
import {
  searchContacts,
  listAllTickets,
  listAllDeals,
} from "../../api/hubspotClient";
import { LoadingState } from "../shared/LoadingState";

import { TabContainer } from "./TabContainer";

export function Dashboard() {
  const tabs = [
    {
      id: "contacts",
      label: "Contacts",
      content: <ContactSearch />,
    },
    {
      id: "tickets",
      label: "Tickets",
      content: <TicketsList />,
    },
    {
      id: "deals",
      label: "Deals",
      content: <DealsList />,
    },
  ];

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Box
        padding="space40"
        borderBottomWidth="borderWidth10"
        borderBottomStyle="solid"
        borderBottomColor="colorBorderWeaker"
      >
        <Text as="h2" fontWeight="fontWeightSemibold" fontSize="fontSize40">
          HubSpot
        </Text>
      </Box>
      <Box flex="1" overflow="auto">
        <TabContainer tabs={tabs} />
      </Box>
    </Box>
  );
}

function ContactSearch() {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (query.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const results = await searchContacts(query);
      setContacts(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Box padding="space40">
      <Box display="flex" columnGap="space30" marginBottom="space40">
        <Box flex="1">
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            insertBefore={<SearchIcon decorative size="sizeIcon20" />}
          />
        </Box>
        <Button variant="primary" onClick={handleSearch} disabled={query.length < 2}>
          Search
        </Button>
      </Box>

      {loading ? (
        <LoadingState text="Searching..." />
      ) : !searched ? (
        <Text as="p" color="colorTextWeak">
          Enter a search term to find contacts
        </Text>
      ) : contacts.length === 0 ? (
        <Text as="p" color="colorTextWeak">
          No contacts found
        </Text>
      ) : (
        <Stack orientation="vertical" spacing="space30">
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  const fullName = [contact.firstname, contact.lastname].filter(Boolean).join(" ") || "Unknown";
  const portalId = process.env.REACT_APP_HUBSPOT_PORTAL_ID || window.appConfig?.HUBSPOT_PORTAL_ID || "";
  const hubspotRegion = process.env.REACT_APP_HUBSPOT_REGION || window.appConfig?.HUBSPOT_REGION || "na1";
  const hubspotUrl = `https://app-${hubspotRegion}.hubspot.com/contacts/${portalId}/record/0-1/${contact.id}`;

  return (
    <Box
      padding="space30"
      borderWidth="borderWidth10"
      borderStyle="solid"
      borderColor="colorBorderWeaker"
      borderRadius="borderRadius20"
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Text as="p" fontWeight="fontWeightSemibold">
            {fullName}
          </Text>
          {(contact.jobtitle || contact.company) && (
            <Text as="p" fontSize="fontSize20" color="colorTextWeak">
              {contact.jobtitle}
              {contact.jobtitle && contact.company && " @ "}
              {contact.company}
            </Text>
          )}
        </Box>
        <Box display="flex" columnGap="space20">
          {contact.phone && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                Actions.invokeAction("StartOutboundCall", {
                  destination: contact.phone,
                });
              }}
            >
              <CallOutgoingIcon decorative size="sizeIcon20" />
              Call
            </Button>
          )}
          <Button
            variant="secondary"
            size="small"
            as="a"
            href={hubspotUrl}
            target="_blank"
          >
            Open
          </Button>
        </Box>
      </Box>
      <Box marginTop="space20" display="flex" columnGap="space30">
        {contact.phone && (
          <Text as="span" fontSize="fontSize20" color="colorTextWeak">
            {contact.phone}
          </Text>
        )}
        {contact.email && (
          <Text as="span" fontSize="fontSize20" color="colorTextWeak">
            {contact.email}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function TicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"open" | "closed" | "all">("open");

  useEffect(() => {
    loadTickets();
  }, [status]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const results = await listAllTickets(status);
      setTickets(results);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding="space40">
      <Box display="flex" columnGap="space30" alignItems="center" marginBottom="space40">
        <Box flex="1">
          <Select
            id="ticket-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as "open" | "closed" | "all")}
          >
            <Option value="open">Open Tickets</Option>
            <Option value="closed">Closed Tickets</Option>
            <Option value="all">All Tickets</Option>
          </Select>
        </Box>
        <Button variant="secondary" size="small" onClick={loadTickets}>
          Refresh
        </Button>
      </Box>

      {loading ? (
        <LoadingState text="Loading tickets..." />
      ) : tickets.length === 0 ? (
        <Text as="p" color="colorTextWeak">
          No tickets found
        </Text>
      ) : (
        <Stack orientation="vertical" spacing="space30">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const stageLabel = getStageLabel(ticket.hs_pipeline_stage);
  const stageVariant = getStageVariant(ticket.hs_pipeline_stage);
  const priorityLabel = getPriorityLabel(ticket.hs_ticket_priority);
  const priorityVariant = getPriorityVariant(ticket.hs_ticket_priority);

  return (
    <Box
      padding="space30"
      borderWidth="borderWidth10"
      borderStyle="solid"
      borderColor="colorBorderWeaker"
      borderRadius="borderRadius20"
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom="space20">
        <Text as="p" fontWeight="fontWeightSemibold">
          {ticket.subject}
        </Text>
        <Box display="flex" columnGap="space20">
          <Badge as="span" variant={priorityVariant}>
            {priorityLabel}
          </Badge>
          <Badge as="span" variant={stageVariant}>
            {stageLabel}
          </Badge>
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text as="span" fontSize="fontSize20" color="colorTextWeak">
          #{ticket.id}
        </Text>
        <Text as="span" fontSize="fontSize20" color="colorTextWeak">
          {getRelativeTime(ticket.createdate)}
        </Text>
      </Box>
    </Box>
  );
}

function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"open" | "closed" | "all">("open");

  useEffect(() => {
    loadDeals();
  }, [status]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const results = await listAllDeals(status);
      setDeals(results);
    } catch (error) {
      console.error("Failed to load deals:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding="space40">
      <Box display="flex" columnGap="space30" alignItems="center" marginBottom="space40">
        <Box flex="1">
          <Select
            id="deal-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as "open" | "closed" | "all")}
          >
            <Option value="open">Open Deals</Option>
            <Option value="closed">Closed Deals</Option>
            <Option value="all">All Deals</Option>
          </Select>
        </Box>
        <Button variant="secondary" size="small" onClick={loadDeals}>
          Refresh
        </Button>
      </Box>

      {loading ? (
        <LoadingState text="Loading deals..." />
      ) : deals.length === 0 ? (
        <Text as="p" color="colorTextWeak">
          No deals found
        </Text>
      ) : (
        <Stack orientation="vertical" spacing="space30">
          {deals.map((deal) => (
            <DealRow key={deal.id} deal={deal} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function DealRow({ deal }: { deal: Deal }) {
  const stageInfo = getDealStageInfo(deal.dealstage);
  const formattedAmount = deal.amount
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
        Number(deal.amount)
      )
    : "—";

  return (
    <Box
      padding="space30"
      borderWidth="borderWidth10"
      borderStyle="solid"
      borderColor="colorBorderWeaker"
      borderRadius="borderRadius20"
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom="space20">
        <Box>
          <Text as="p" fontWeight="fontWeightSemibold">
            {deal.dealname}
          </Text>
        </Box>
        <Box display="flex" alignItems="center" columnGap="space20">
          <Text as="span" fontWeight="fontWeightSemibold">
            {formattedAmount}
          </Text>
          <Badge as="span" variant={stageInfo.variant}>
            {stageInfo.label}
          </Badge>
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text as="span" fontSize="fontSize20" color="colorTextWeak">
          #{deal.id}
        </Text>
        <Text as="span" fontSize="fontSize20" color="colorTextWeak">
          {getRelativeTime(deal.createdate)}
        </Text>
      </Box>
    </Box>
  );
}

function getStageLabel(stage: string): string {
  const stages: Record<string, string> = {
    "1": "New",
    "2": "Waiting on contact",
    "3": "Waiting on us",
    "4": "Closed",
  };
  return stages[stage] || stage;
}

function getStageVariant(stage: string): "success" | "warning" | "info" | "default" {
  if (stage === "4") return "success";
  if (stage === "2") return "warning";
  if (stage === "3") return "info";
  return "default";
}

function getPriorityLabel(priority: string): string {
  const priorities: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  };
  return priorities[priority] || priority || "Medium";
}

function getPriorityVariant(priority: string): "error" | "warning" | "default" {
  if (priority === "HIGH") return "error";
  if (priority === "MEDIUM") return "warning";
  return "default";
}

function getDealStageInfo(stage: string): { label: string; variant: "success" | "error" | "warning" | "info" | "default" } {
  const stages: Record<string, { label: string; variant: "success" | "error" | "warning" | "info" | "default" }> = {
    appointmentscheduled: { label: "Appointment Scheduled", variant: "default" },
    qualifiedtobuy: { label: "Qualified to Buy", variant: "info" },
    presentationscheduled: { label: "Presentation Scheduled", variant: "info" },
    decisionmakerboughtin: { label: "Decision Maker Bought-In", variant: "info" },
    contractsent: { label: "Contract Sent", variant: "warning" },
    closedwon: { label: "Closed Won", variant: "success" },
    closedlost: { label: "Closed Lost", variant: "error" },
  };
  return stages[stage] || { label: stage, variant: "default" };
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
