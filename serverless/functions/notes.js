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

  // DELETE: Delete note
  if (event.noteId && !event.body) {
    try {
      await client.crm.objects.basicApi.archive("notes", event.noteId);
      response.setStatusCode(200);
      response.setBody({ success: true });
      return callback(null, response);
    } catch (error) {
      console.error("HubSpot delete note error:", error);
      response.setStatusCode(500);
      response.setBody({ error: "Failed to delete note", details: error.message });
      return callback(null, response);
    }
  }

  // POST: Create note
  if (event.body && event.contactId) {
    try {
      // Create note with association in a single call
      const noteResponse = await client.crm.objects.basicApi.create("notes", {
        properties: {
          hs_note_body: event.body,
          hs_timestamp: new Date().toISOString(),
        },
        associations: [
          {
            to: { id: event.contactId },
            types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
          },
        ],
      });

      response.setStatusCode(201);
      response.setBody({
        id: noteResponse.id,
        body: noteResponse.properties.hs_note_body,
        timestamp: noteResponse.properties.hs_timestamp,
      });
      return callback(null, response);
    } catch (error) {
      console.error("HubSpot create note error:", error);
      response.setStatusCode(500);
      response.setBody({ error: "Failed to create note", details: error.message });
      return callback(null, response);
    }
  }

  // GET: List notes for contact
  if (!event.contactId) {
    response.setStatusCode(400);
    response.setBody({ error: "contactId is required" });
    return callback(null, response);
  }

  try {
    const associationsResponse =
      await client.crm.associations.v4.basicApi.getPage(
        "contacts",
        event.contactId,
        "notes"
      );

    const noteIds = associationsResponse.results.map((a) => a.toObjectId);

    if (noteIds.length === 0) {
      response.setStatusCode(200);
      response.setBody({ notes: [] });
      return callback(null, response);
    }

    const notesResponse = await client.crm.objects.batchApi.read("notes", {
      inputs: noteIds.map((id) => ({ id })),
      properties: ["hs_note_body", "hs_timestamp", "hs_lastmodifieddate"],
    });

    const notes = notesResponse.results
      .map((n) => ({
        id: n.id,
        body: n.properties.hs_note_body || "",
        timestamp: n.properties.hs_timestamp || "",
        lastmodifieddate: n.properties.hs_lastmodifieddate || "",
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    response.setStatusCode(200);
    response.setBody({ notes });
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot list notes error:", error);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to list notes" });
    return callback(null, response);
  }
};
