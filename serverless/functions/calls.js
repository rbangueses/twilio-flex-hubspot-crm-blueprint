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

exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.appendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  const client = getHubSpotClient();

  // DELETE: Delete activity (call or note)
  if (event.activityId && event.activityType) {
    try {
      await client.crm.objects.basicApi.archive(event.activityType, event.activityId);
      response.setStatusCode(200);
      response.setBody({ success: true });
      return callback(null, response);
    } catch (error) {
      console.error("HubSpot delete activity error:", error.message, error.body);
      response.setStatusCode(500);
      response.setBody({ error: "Failed to delete activity", details: error.message });
      return callback(null, response);
    }
  }

  // POST: Log a call
  if (event.contactId && event.body) {
    try {
      const callResponse = await client.crm.objects.basicApi.create("calls", {
        properties: {
          hs_call_body: event.body,
          hs_call_direction: event.direction || "INBOUND",
          hs_call_disposition: event.disposition || "connected",
          hs_call_duration: event.duration || "0",
          hs_call_status: "COMPLETED",
          hs_timestamp: event.timestamp || new Date().toISOString(),
        },
        associations: [
          {
            to: { id: event.contactId },
            types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 194 }],
          },
        ],
      });

      response.setStatusCode(201);
      response.setBody({
        id: callResponse.id,
        body: callResponse.properties.hs_call_body,
        direction: callResponse.properties.hs_call_direction,
        timestamp: callResponse.properties.hs_timestamp,
      });
      return callback(null, response);
    } catch (error) {
      console.error("HubSpot create call error:", error.message, error.body);
      response.setStatusCode(500);
      response.setBody({ error: "Failed to log call", details: error.message });
      return callback(null, response);
    }
  }

  // GET: List activities (calls, notes, emails) for contact
  if (!event.contactId) {
    response.setStatusCode(400);
    response.setBody({ error: "contactId is required" });
    return callback(null, response);
  }

  try {
    const activities = [];

    // Get calls
    try {
      const callsAssoc = await client.crm.associations.v4.basicApi.getPage(
        "contacts",
        event.contactId,
        "calls"
      );
      const callIds = callsAssoc.results.map((a) => a.toObjectId);
      if (callIds.length > 0) {
        const callsResponse = await client.crm.objects.batchApi.read("calls", {
          inputs: callIds.map((id) => ({ id })),
          properties: ["hs_call_body", "hs_call_direction", "hs_call_status", "hs_timestamp", "hs_call_duration"],
        });
        callsResponse.results.forEach((c) => {
          activities.push({
            id: c.id,
            type: "call",
            body: c.properties.hs_call_body || "",
            direction: c.properties.hs_call_direction || "",
            timestamp: c.properties.hs_timestamp || "",
            duration: c.properties.hs_call_duration || "0",
          });
        });
      }
    } catch (e) {
      console.log("No calls or error fetching calls:", e.message);
    }

    // Get notes
    try {
      const notesAssoc = await client.crm.associations.v4.basicApi.getPage(
        "contacts",
        event.contactId,
        "notes"
      );
      const noteIds = notesAssoc.results.map((a) => a.toObjectId);
      if (noteIds.length > 0) {
        const notesResponse = await client.crm.objects.batchApi.read("notes", {
          inputs: noteIds.map((id) => ({ id })),
          properties: ["hs_note_body", "hs_timestamp"],
        });
        notesResponse.results.forEach((n) => {
          activities.push({
            id: n.id,
            type: "note",
            body: n.properties.hs_note_body || "",
            timestamp: n.properties.hs_timestamp || "",
          });
        });
      }
    } catch (e) {
      console.log("No notes or error fetching notes:", e.message);
    }

    // Get emails
    try {
      const emailsAssoc = await client.crm.associations.v4.basicApi.getPage(
        "contacts",
        event.contactId,
        "emails"
      );
      const emailIds = emailsAssoc.results.map((a) => a.toObjectId);
      if (emailIds.length > 0) {
        const emailsResponse = await client.crm.objects.batchApi.read("emails", {
          inputs: emailIds.map((id) => ({ id })),
          properties: ["hs_email_subject", "hs_email_text", "hs_timestamp", "hs_email_direction"],
        });
        emailsResponse.results.forEach((e) => {
          activities.push({
            id: e.id,
            type: "email",
            subject: e.properties.hs_email_subject || "",
            body: e.properties.hs_email_text || "",
            direction: e.properties.hs_email_direction || "",
            timestamp: e.properties.hs_timestamp || "",
          });
        });
      }
    } catch (e) {
      console.log("No emails or error fetching emails:", e.message);
    }

    // Sort by timestamp, most recent first
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    response.setStatusCode(200);
    response.setBody({ activities });
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot list activities error:", error);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to list activities" });
    return callback(null, response);
  }
};
