import { Box, Text, Heading, Button, Avatar } from "@twilio-paste/core";
import { LinkExternalIcon } from "@twilio-paste/icons/esm/LinkExternalIcon";
import { CallOutgoingIcon } from "@twilio-paste/icons/esm/CallOutgoingIcon";
import { Actions } from "@twilio/flex-ui";
import { Contact, Company } from "../../types";

interface ContactHeaderProps {
  contact: Contact;
  companies: Company[];
}

export function ContactHeader({ contact, companies }: ContactHeaderProps) {
  const fullName = [contact.firstname, contact.lastname]
    .filter(Boolean)
    .join(" ") || "Unknown";
  const company = companies[0];
  const portalId = process.env.REACT_APP_HUBSPOT_PORTAL_ID || window.appConfig?.HUBSPOT_PORTAL_ID || "";
  const hubspotRegion = process.env.REACT_APP_HUBSPOT_REGION || window.appConfig?.HUBSPOT_REGION || "na1"; // eu1 for EU, na1 for US
  const hubspotUrl = `https://app-${hubspotRegion}.hubspot.com/contacts/${portalId}/record/0-1/${contact.id}`;

  return (
    <Box
      padding="space40"
      borderBottomWidth="borderWidth10"
      borderBottomStyle="solid"
      borderBottomColor="colorBorderWeaker"
    >
      <Box display="flex" alignItems="flex-start">
        <Avatar size="sizeIcon90" name={fullName} />
        <Box marginLeft="space40" flex="1">
          <Box display="flex" justifyContent="space-between" alignItems="start">
            <Box>
              <Heading as="h3" variant="heading40" marginBottom="space0">
                {fullName}
              </Heading>
              {(contact.jobtitle || company) && (
                <Text as="p" color="colorTextWeak" fontSize="fontSize20">
                  {contact.jobtitle}
                  {contact.jobtitle && company && " @ "}
                  {company?.name}
                </Text>
              )}
            </Box>
            <Button
              variant="secondary"
              size="small"
              as="a"
              href={hubspotUrl}
              target="_blank"
            >
              <LinkExternalIcon decorative />
              Open
            </Button>
          </Box>
          <Box marginTop="space20" display="flex" alignItems="center" columnGap="space20">
            {contact.phone && (
              <Button
                variant="link"
                size="reset"
                onClick={() => {
                  Actions.invokeAction("StartOutboundCall", {
                    destination: contact.phone,
                  });
                }}
              >
                <Box display="flex" alignItems="center" columnGap="space10">
                  <CallOutgoingIcon decorative size="sizeIcon20" />
                  <Text as="span" fontSize="fontSize20">
                    {contact.phone}
                  </Text>
                </Box>
              </Button>
            )}
            {contact.phone && contact.email && (
              <Text as="span" fontSize="fontSize20" color="colorTextWeak">•</Text>
            )}
            {contact.email && (
              <Text as="span" fontSize="fontSize20" color="colorTextWeak">
                {contact.email}
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
