import { useState, useEffect } from "react";
import {
  Box,
  Text,
  Button,
  Input,
  Label,
  Stack,
  TextArea,
  Separator,
  Select,
  Option,
} from "@twilio-paste/core";
import { CallIcon } from "@twilio-paste/icons/esm/CallIcon";
import { NotesIcon } from "@twilio-paste/icons/esm/NotesIcon";
import { EmailIcon } from "@twilio-paste/icons/esm/EmailIcon";
import { UserIcon } from "@twilio-paste/icons/esm/UserIcon";
import { Contact, Activity } from "../../types";
import { updateContact, getActivities, logCall, deleteActivity } from "../../api/hubspotClient";
import { DeleteIcon } from "@twilio-paste/icons/esm/DeleteIcon";
import { LoadingState } from "../shared/LoadingState";

interface DetailsTabProps {
  contact: Contact;
  onContactUpdated: () => void;
}

export function DetailsTab({ contact, onContactUpdated }: DetailsTabProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstname: contact.firstname,
    lastname: contact.lastname,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    jobtitle: contact.jobtitle,
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loggingCall, setLoggingCall] = useState(false);
  const [callForm, setCallForm] = useState({ body: "", direction: "INBOUND" });
  const [savingCall, setSavingCall] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [contact.id]);

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const data = await getActivities(contact.id);
      setActivities(data);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateContact(contact.id, formData);
      setEditing(false);
      onContactUpdated();
    } catch (error) {
      console.error("Failed to update contact:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogCall = async () => {
    if (!callForm.body.trim()) return;
    setSavingCall(true);
    try {
      await logCall({
        contactId: contact.id,
        body: callForm.body,
        direction: callForm.direction,
      });
      setCallForm({ body: "", direction: "INBOUND" });
      setLoggingCall(false);
      loadActivities();
    } catch (error) {
      console.error("Failed to log call:", error);
    } finally {
      setSavingCall(false);
    }
  };

  if (saving) {
    return <LoadingState text="Saving..." />;
  }

  if (editing) {
    return (
      <Box padding="space40">
        <Stack orientation="vertical" spacing="space40">
          <Box>
            <Label htmlFor="firstname">First Name</Label>
            <Input
              id="firstname"
              type="text"
              value={formData.firstname}
              onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
            />
          </Box>
          <Box>
            <Label htmlFor="lastname">Last Name</Label>
            <Input
              id="lastname"
              type="text"
              value={formData.lastname}
              onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            />
          </Box>
          <Box>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </Box>
          <Box>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Box>
          <Box>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </Box>
          <Box>
            <Label htmlFor="jobtitle">Job Title</Label>
            <Input
              id="jobtitle"
              type="text"
              value={formData.jobtitle}
              onChange={(e) => setFormData({ ...formData, jobtitle: e.target.value })}
            />
          </Box>
          <Box display="flex" columnGap="space30">
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box padding="space40">
      <Stack orientation="vertical" spacing="space30">
        <DetailRow label="Lifecycle Stage" value={contact.lifecyclestage || "—"} />
        <DetailRow label="Lead Status" value={contact.hs_lead_status || "—"} />
        <DetailRow label="Company" value={contact.company || "—"} />
        <DetailRow label="Job Title" value={contact.jobtitle || "—"} />
        <DetailRow
          label="Last Modified"
          value={contact.lastmodifieddate ? new Date(contact.lastmodifieddate).toLocaleDateString() : "—"}
        />
        <Box marginTop="space20">
          <Button variant="secondary" size="small" onClick={() => setEditing(true)}>
            Edit Contact
          </Button>
        </Box>
      </Stack>

      <Separator orientation="horizontal" verticalSpacing="space60" />

      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="space40">
          <Text as="h4" fontWeight="fontWeightSemibold">
            Recent Activities
          </Text>
          <Button variant="secondary" size="small" onClick={() => setLoggingCall(true)}>
            + Log Call
          </Button>
        </Box>

        {loggingCall && (
          <Box
            padding="space40"
            marginBottom="space40"
            backgroundColor="colorBackgroundWeak"
            borderRadius="borderRadius20"
          >
            <Stack orientation="vertical" spacing="space30">
              <Box>
                <Label htmlFor="call-direction">Direction</Label>
                <Select
                  id="call-direction"
                  value={callForm.direction}
                  onChange={(e) => setCallForm({ ...callForm, direction: e.target.value })}
                >
                  <Option value="INBOUND">Inbound</Option>
                  <Option value="OUTBOUND">Outbound</Option>
                </Select>
              </Box>
              <Box>
                <Label htmlFor="call-body" required>
                  Notes
                </Label>
                <TextArea
                  id="call-body"
                  value={callForm.body}
                  onChange={(e) => setCallForm({ ...callForm, body: e.target.value })}
                  placeholder="Call summary..."
                />
              </Box>
              <Box display="flex" columnGap="space30">
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleLogCall}
                  loading={savingCall}
                  disabled={!callForm.body.trim()}
                >
                  Save Call
                </Button>
                <Button variant="secondary" size="small" onClick={() => setLoggingCall(false)}>
                  Cancel
                </Button>
              </Box>
            </Stack>
          </Box>
        )}

        {loadingActivities ? (
          <LoadingState text="Loading activities..." />
        ) : activities.length === 0 ? (
          <Text as="p" color="colorTextWeak">
            No activities yet
          </Text>
        ) : (
          <ActivityTimeline activities={activities} onDelete={loadActivities} />
        )}
      </Box>
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text as="span" fontSize="fontSize20" color="colorTextWeak">
        {label}
      </Text>
      <Text as="p" marginTop="space10">
        {value}
      </Text>
    </Box>
  );
}

function ActivityTimeline({ activities, onDelete }: { activities: Activity[]; onDelete: () => void }) {
  const grouped = groupByMonth(activities);

  return (
    <Stack orientation="vertical" spacing="space50">
      {Object.entries(grouped).map(([month, items]) => (
        <Box key={month}>
          <Text as="p" fontWeight="fontWeightSemibold" marginBottom="space30">
            {month}
          </Text>
          <Stack orientation="vertical" spacing="space30">
            {items.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} onDelete={onDelete} />
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

function ActivityItem({ activity, onDelete }: { activity: Activity; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const canDelete = activity.type === "call" || activity.type === "note";

  const handleDelete = async () => {
    if (!confirm("Delete this activity?")) return;
    setDeleting(true);
    try {
      const objectType = activity.type === "call" ? "calls" : "notes";
      await deleteActivity(activity.id, objectType);
      onDelete();
    } catch (err) {
      console.error("Failed to delete activity:", err);
    } finally {
      setDeleting(false);
    }
  };

  const getIcon = () => {
    switch (activity.type) {
      case "call":
        return <CallIcon decorative size="sizeIcon30" color="colorTextIcon" />;
      case "note":
        return <NotesIcon decorative size="sizeIcon30" color="colorTextIcon" />;
      case "email":
        return <EmailIcon decorative size="sizeIcon30" color="colorTextIcon" />;
      default:
        return <UserIcon decorative size="sizeIcon30" color="colorTextIcon" />;
    }
  };

  const getTitle = () => {
    switch (activity.type) {
      case "call":
        return `Logged ${activity.direction?.toLowerCase() || ""} call`;
      case "note":
        return "Note";
      case "email":
        return activity.subject || "Email";
      default:
        return "Activity";
    }
  };

  const date = new Date(activity.timestamp);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Box display="flex" columnGap="space30">
      <Box
        flexShrink={0}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        {getIcon()}
        <Box
          width="2px"
          flex="1"
          backgroundColor="colorBackgroundWeak"
          marginTop="space20"
        />
      </Box>
      <Box flex="1" paddingBottom="space30" minWidth="0">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text as="p" fontWeight="fontWeightSemibold" fontSize="fontSize20">
            {getTitle()}
          </Text>
          {canDelete && (
            <Button
              variant="destructive_icon"
              size="reset"
              onClick={handleDelete}
              loading={deleting}
            >
              <DeleteIcon decorative={false} title="Delete" size="sizeIcon20" />
            </Button>
          )}
        </Box>
        <Text as="span" fontSize="fontSize10" color="colorTextWeak">
          {formattedDate}
        </Text>
        {activity.body && (
          <Text as="p" fontSize="fontSize20" color="colorTextWeak" marginTop="space10" wordBreak="break-word">
            {activity.body}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function groupByMonth(activities: Activity[]): Record<string, Activity[]> {
  const groups: Record<string, Activity[]> = {};

  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
  });

  return groups;
}
