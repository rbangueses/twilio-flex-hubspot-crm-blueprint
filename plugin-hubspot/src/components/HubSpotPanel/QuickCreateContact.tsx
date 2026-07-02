import { useState } from "react";
import {
  Box,
  Text,
  Heading,
  Button,
  Input,
  Label,
  Stack,
  Anchor,
  Separator,
} from "@twilio-paste/core";
import { createContact } from "../../api/hubspotClient";

interface QuickCreateContactProps {
  phone: string;
  onContactCreated: () => void;
}

export function QuickCreateContact({ phone, onContactCreated }: QuickCreateContactProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: phone,
  });

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      await createContact(formData);
      onContactCreated();
    } catch (err) {
      const errorMessage = (err as Error).message || "";
      if (errorMessage.includes("409")) {
        // Contact already exists - refresh to show it
        onContactCreated();
        return;
      }
      setError("Failed to create contact. Please try again.");
      console.error("Failed to create contact:", err);
    } finally {
      setSaving(false);
    }
  };

  const portalId = process.env.REACT_APP_HUBSPOT_PORTAL_ID || window.appConfig?.HUBSPOT_PORTAL_ID || "";
  const hubspotRegion = process.env.REACT_APP_HUBSPOT_REGION || window.appConfig?.HUBSPOT_REGION || "na1";
  const hubspotSearchUrl = `https://app-${hubspotRegion}.hubspot.com/contacts/${portalId}/objects/0-1/views/all/list?query=${encodeURIComponent(phone)}`;

  return (
    <Box padding="space60">
      <Box textAlign="center" marginBottom="space60">
        <Heading as="h3" variant="heading40">
          No contact found
        </Heading>
        <Text as="p" color="colorTextWeak">
          for {phone}
        </Text>
      </Box>

      <Box textAlign="center" marginBottom="space40">
        <Anchor href={hubspotSearchUrl} target="_blank">
          Search in HubSpot
        </Anchor>
      </Box>

      <Separator orientation="horizontal" />

      <Box marginTop="space40">
        <Text as="p" textAlign="center" color="colorTextWeak" marginBottom="space40">
          or create new
        </Text>

        <Stack orientation="vertical" spacing="space40">
          <Box>
            <Label htmlFor="create-firstname">First Name</Label>
            <Input
              id="create-firstname"
              type="text"
              value={formData.firstname}
              onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
            />
          </Box>
          <Box>
            <Label htmlFor="create-lastname">Last Name</Label>
            <Input
              id="create-lastname"
              type="text"
              value={formData.lastname}
              onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            />
          </Box>
          <Box>
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </Box>
          <Box>
            <Label htmlFor="create-phone">Phone</Label>
            <Input
              id="create-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Box>

          {error && (
            <Text as="p" color="colorTextError">
              {error}
            </Text>
          )}

          <Button variant="primary" onClick={handleCreate} loading={saving} fullWidth>
            Create Contact
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
