import { useState, useMemo } from "react";
import {
  Box,
  Text,
  Button,
  Input,
  Label,
  TextArea,
  Stack,
  Badge,
  Select,
  Option,
} from "@twilio-paste/core";
import { ChevronDownIcon } from "@twilio-paste/icons/esm/ChevronDownIcon";
import { ChevronUpIcon } from "@twilio-paste/icons/esm/ChevronUpIcon";
import { Ticket } from "../../types";
import { createTicket, updateTicket } from "../../api/hubspotClient";
import { LoadingState } from "../shared/LoadingState";
import { ErrorBanner } from "../shared/ErrorBanner";

interface TicketsTabProps {
  contactId: string;
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function TicketsTab({
  contactId,
  tickets,
  loading,
  error,
  onRefresh,
}: TicketsTabProps) {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("1");
  const [priority, setPriority] = useState("MEDIUM");

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const aOpen = a.hs_pipeline_stage !== "4";
      const bOpen = b.hs_pipeline_stage !== "4";
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return new Date(b.createdate).getTime() - new Date(a.createdate).getTime();
    });
  }, [tickets]);

  const handleCreate = async () => {
    if (!subject.trim()) return;
    setSaving(true);
    try {
      await createTicket({
        contactId,
        subject,
        content,
        hs_pipeline_stage: status,
        hs_ticket_priority: priority,
      });
      setSubject("");
      setContent("");
      setStatus("1");
      setPriority("MEDIUM");
      setCreating(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading tickets..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={onRefresh} />;
  }

  return (
    <Box padding="space40">
      {creating ? (
        <Stack orientation="vertical" spacing="space40">
          <Box>
            <Label htmlFor="ticket-subject" required>
              Subject
            </Label>
            <Input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Box>
          <Box>
            <Label htmlFor="ticket-content">Description</Label>
            <TextArea
              id="ticket-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Box>
          <Box display="flex" columnGap="space40">
            <Box flex="1">
              <Label htmlFor="ticket-status">Status</Label>
              <Select
                id="ticket-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <Option value="1">New</Option>
                <Option value="2">Waiting on contact</Option>
                <Option value="3">Waiting on us</Option>
                <Option value="4">Closed</Option>
              </Select>
            </Box>
            <Box flex="1">
              <Label htmlFor="ticket-priority">Priority</Label>
              <Select
                id="ticket-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <Option value="LOW">Low</Option>
                <Option value="MEDIUM">Medium</Option>
                <Option value="HIGH">High</Option>
              </Select>
            </Box>
          </Box>
          <Box display="flex" columnGap="space30">
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={saving}
              disabled={!subject.trim()}
            >
              Create Ticket
            </Button>
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </Box>
        </Stack>
      ) : (
        <>
          <Box marginBottom="space40">
            <Button variant="secondary" size="small" onClick={() => setCreating(true)}>
              + New Ticket
            </Button>
          </Box>
          {sortedTickets.length === 0 ? (
            <Text as="p" color="colorTextWeak">
              No tickets found
            </Text>
          ) : (
            <Stack orientation="vertical" spacing="space30">
              {sortedTickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} onUpdate={onRefresh} />
              ))}
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}

function TicketRow({ ticket, onUpdate }: { ticket: Ticket; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editContent, setEditContent] = useState(ticket.content);
  const [editStatus, setEditStatus] = useState(ticket.hs_pipeline_stage);
  const [editPriority, setEditPriority] = useState(ticket.hs_ticket_priority || "MEDIUM");

  const stageLabel = getStageLabel(ticket.hs_pipeline_stage);
  const stageVariant = getStageVariant(ticket.hs_pipeline_stage);
  const priorityLabel = getPriorityLabel(ticket.hs_ticket_priority);
  const priorityVariant = getPriorityVariant(ticket.hs_ticket_priority);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTicket({
        ticketId: ticket.id,
        hs_pipeline_stage: editStatus,
        hs_ticket_priority: editPriority,
        content: editContent,
      });
      setEditing(false);
      onUpdate();
    } catch (err) {
      console.error("Failed to update ticket:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      borderWidth="borderWidth10"
      borderStyle="solid"
      borderColor="colorBorderWeaker"
      borderRadius="borderRadius20"
    >
      <Box
        padding="space30"
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom="space20">
          <Box display="flex" alignItems="center" columnGap="space20" flex="1">
            {expanded ? (
              <ChevronUpIcon decorative size="sizeIcon20" />
            ) : (
              <ChevronDownIcon decorative size="sizeIcon20" />
            )}
            <Text as="span" fontWeight="fontWeightSemibold">
              {ticket.subject}
            </Text>
          </Box>
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

      {expanded && (
        <Box
          padding="space40"
          borderTopWidth="borderWidth10"
          borderTopStyle="solid"
          borderTopColor="colorBorderWeaker"
          backgroundColor="colorBackgroundWeak"
        >
          {editing ? (
            <Stack orientation="vertical" spacing="space40">
              <Box display="flex" columnGap="space40">
                <Box flex="1">
                  <Label htmlFor={`status-${ticket.id}`}>Status</Label>
                  <Select
                    id={`status-${ticket.id}`}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <Option value="1">New</Option>
                    <Option value="2">Waiting on contact</Option>
                    <Option value="3">Waiting on us</Option>
                    <Option value="4">Closed</Option>
                  </Select>
                </Box>
                <Box flex="1">
                  <Label htmlFor={`priority-${ticket.id}`}>Priority</Label>
                  <Select
                    id={`priority-${ticket.id}`}
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <Option value="LOW">Low</Option>
                    <Option value="MEDIUM">Medium</Option>
                    <Option value="HIGH">High</Option>
                  </Select>
                </Box>
              </Box>
              <Box>
                <Label htmlFor={`content-${ticket.id}`}>Description</Label>
                <TextArea
                  id={`content-${ticket.id}`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </Box>
              <Box display="flex" columnGap="space30">
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleSave}
                  loading={saving}
                >
                  Save
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setEditing(false);
                    setEditContent(ticket.content);
                    setEditStatus(ticket.hs_pipeline_stage);
                    setEditPriority(ticket.hs_ticket_priority || "MEDIUM");
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          ) : (
            <>
              <Box marginBottom="space30">
                <Text as="span" fontSize="fontSize20" color="colorTextWeak">
                  Description
                </Text>
                <Text as="p" marginTop="space10">
                  {ticket.content || "No description"}
                </Text>
              </Box>
              <Box marginBottom="space30">
                <Text as="span" fontSize="fontSize20" color="colorTextWeak">
                  Last Modified
                </Text>
                <Text as="p" marginTop="space10">
                  {ticket.hs_lastmodifieddate
                    ? getRelativeTime(ticket.hs_lastmodifieddate)
                    : "—"}
                </Text>
              </Box>
              <Button variant="secondary" size="small" onClick={() => setEditing(true)}>
                Edit Ticket
              </Button>
            </>
          )}
        </Box>
      )}
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

function getPriorityVariant(priority: string): "error" | "warning" | "info" | "default" {
  if (priority === "HIGH") return "error";
  if (priority === "MEDIUM") return "warning";
  return "default";
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
