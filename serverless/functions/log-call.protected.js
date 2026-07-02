const { Client } = require("@hubspot/api-client");

let client = null;

function getHubSpotClient() {
  if (!client) {
    const accessToken = process.env.HUBSPOT_API_KEY;
    if (!accessToken) {
      throw new Error("HUBSPOT_API_KEY environment variable not set");
    }
    client = new Client({ accessToken });
  }
  return client;
}

const fieldLabels = {
  product_id: "Product",
  warehouse_stock: "Stock",
  requested_quantity: "Quantity",
  delivery_location: "Location",
  target_date: "Target Date",
  escalation_reason: "Escalation",
};

function formatConversationSummary(summary) {
  if (!summary || typeof summary !== "string") {
    return summary || "Call logged via Twilio Studio";
  }

  const trimmed = summary.trim();
  if (!trimmed.startsWith("{")) {
    return summary;
  }

  try {
    const data = JSON.parse(trimmed);
    const lines = [];

    for (const [key, label] of Object.entries(fieldLabels)) {
      if (data[key]) {
        lines.push(`${label}: ${data[key]}`);
      }
    }

    // Add any extra fields not in our label map
    for (const [key, value] of Object.entries(data)) {
      if (!fieldLabels[key] && value) {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        lines.push(`${label}: ${value}`);
      }
    }

    return lines.length > 0 ? lines.join("\n") : summary;
  } catch {
    return summary;
  }
}

exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  const {
    phone,      // DEPRECATED: kept for backward compatibility
    from,       // NEW: caller number
    to,         // NEW: dialed number
    conversationSummary,
    direction,
    duration,
    callSid,
  } = event;

  // Determine customer phone based on direction
  // - Inbound: customer is the caller (from)
  // - Outbound: customer is the dialed party (to)
  // - Fallback to legacy `phone` param for backward compatibility
  let customerPhone;
  if (from && to && direction) {
    customerPhone = direction.toUpperCase() === "OUTBOUND" ? to : from;
    console.log(`Direction: ${direction}, From: ${from}, To: ${to}, Customer: ${customerPhone}`);
  } else {
    customerPhone = phone;
    console.log(`Using legacy phone param: ${customerPhone}`);
  }

  if (!customerPhone) {
    response.setStatusCode(400);
    response.setBody({ error: "phone (or from/to/direction) is required" });
    return callback(null, response);
  }

  try {
    const hsClient = getHubSpotClient();

    // Search for contact by phone
    const phoneVariants = [
      customerPhone,
      customerPhone.replace(/\s+/g, ""),
      customerPhone.replace(/[^+\d]/g, ""),
    ];

    let contact = null;
    for (const phoneVariant of phoneVariants) {
      try {
        const searchResponse = await hsClient.crm.contacts.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                { propertyName: "phone", operator: "EQ", value: phoneVariant },
              ],
            },
          ],
          properties: ["firstname", "lastname", "email", "phone"],
          limit: 1,
        });

        if (searchResponse.results && searchResponse.results.length > 0) {
          contact = searchResponse.results[0];
          break;
        }
      } catch (searchError) {
        console.log("Search error for phone", phoneVariant, ":", searchError.message);
      }
    }

    if (!contact) {
      console.log("No HubSpot contact found for phone:", customerPhone);
      response.setStatusCode(200);
      response.setBody({
        status: "skipped",
        reason: "no matching HubSpot contact",
        phone: customerPhone,
      });
      return callback(null, response);
    }

    console.log("Found contact:", contact.id, contact.properties.firstname, contact.properties.lastname);

    // Build call body - format JSON summaries to human-readable text
    let callBody = formatConversationSummary(conversationSummary);

    if (callSid) {
      callBody += `\n\nCall SID: ${callSid}`;
    }

    // Create call in HubSpot
    const callResponse = await hsClient.crm.objects.basicApi.create("calls", {
      properties: {
        hs_call_body: callBody,
        hs_call_direction: (direction || "INBOUND").toUpperCase(),
        hs_call_disposition: "connected",
        hs_call_duration: String(duration || "0"),
        hs_call_status: "COMPLETED",
        hs_timestamp: new Date().toISOString(),
      },
      associations: [
        {
          to: { id: contact.id },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 194 }],
        },
      ],
    });

    console.log("Created HubSpot call:", callResponse.id);

    response.setStatusCode(201);
    response.setBody({
      status: "success",
      hubspot_call_id: callResponse.id,
      hubspot_contact_id: contact.id,
      contact_name: `${contact.properties.firstname || ""} ${contact.properties.lastname || ""}`.trim(),
    });
    return callback(null, response);

  } catch (error) {
    console.error("Log call error:", error.message, error.body);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to log call", details: error.message });
    return callback(null, response);
  }
};
