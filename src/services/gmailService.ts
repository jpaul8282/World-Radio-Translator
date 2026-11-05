/**
 * Gmail Service for Google Workspace Integration
 * Supports reading user profile, drafting emails, sending broadcast transcripts & summaries,
 * searching messages, and deleting items with user confirmation.
 */

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  bodyHtml: string;
  from?: string;
}

/**
 * Creates an RFC 2822 compliant MIME message string and returns it base64url-encoded.
 * Handles full UTF-8 Unicode content properly across both browser and Node test environments.
 */
export function createRfc2822Base64Url({
  to,
  subject,
  bodyHtml,
  from,
}: SendEmailOptions): string {
  let utf8Subject = subject;
  try {
    if (typeof Buffer !== "undefined") {
      utf8Subject = `=?utf-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
    } else {
      utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    }
  } catch {
    utf8Subject = subject;
  }

  const headers = [
    from ? `From: ${from}` : "",
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`,
  ].filter(Boolean);

  const rawMessage = `${headers.join("\r\n")}\r\n\r\n${bodyHtml}`;

  // Base64URL encode (RFC 4648 §5)
  if (typeof Buffer !== "undefined") {
    return Buffer.from(rawMessage, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  return btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Fetch the authenticated user's Gmail profile information
 */
export async function fetchGmailProfile(accessToken: string): Promise<GmailProfile> {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail profile request failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Sends an email using the Gmail API (users.messages.send).
 * Note: Must be invoked only after user confirmation.
 */
export async function sendGmailMessage(
  accessToken: string,
  options: SendEmailOptions
): Promise<{ id: string; threadId: string }> {
  const raw = createRfc2822Base64Url(options);

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to send email via Gmail (${response.status}): ${err}`);
  }

  return await response.json();
}

/**
 * Creates a draft email in the user's Gmail mailbox (users.drafts.create)
 */
export async function createGmailDraft(
  accessToken: string,
  options: SendEmailOptions
): Promise<{ id: string; message: { id: string; threadId: string } }> {
  const raw = createRfc2822Base64Url(options);

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: { raw },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create Gmail draft (${response.status}): ${err}`);
  }

  return await response.json();
}

/**
 * Searches and lists recent messages from the user's Gmail mailbox
 */
export async function listRecentGmailMessages(
  accessToken: string,
  query: string = "World Radio",
  maxResults: number = 8
): Promise<GmailMessageSummary[]> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to list Gmail messages (${response.status}): ${err}`);
  }

  const data = await response.json();
  if (!data.messages || !Array.isArray(data.messages)) {
    return [];
  }

  // Fetch headers for each message concurrently
  const messagePromises = data.messages.map(async (msg: { id: string; threadId: string }) => {
    try {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!detailRes.ok) return null;
      const detail = await detailRes.json();
      
      const getHeader = (name: string) =>
        detail.payload?.headers?.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      return {
        id: detail.id,
        threadId: detail.threadId,
        snippet: detail.snippet || "",
        subject: getHeader("Subject") || "(No Subject)",
        from: getHeader("From") || "",
        date: getHeader("Date") || "",
      };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(messagePromises);
  return results.filter((m): m is GmailMessageSummary => m !== null);
}

/**
 * Deletes a specific message by ID from Gmail.
 * Note: Must be invoked only after explicit user confirmation.
 */
export async function deleteGmailMessage(
  accessToken: string,
  messageId: string
): Promise<void> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.text();
    throw new Error(`Failed to delete Gmail message (${response.status}): ${err}`);
  }
}

/**
 * Formats an HTML email template for a radio broadcast translation digest
 */
export function formatBroadcastDigestHtml({
  stationName,
  stationCountry,
  stationLanguage,
  streamUrl,
  targetLanguage,
  turns,
  summary,
}: {
  stationName: string;
  stationCountry?: string;
  stationLanguage?: string;
  streamUrl?: string;
  targetLanguage: string;
  turns: Array<{ timestamp?: string; originalText: string; translatedText: string; speaker?: string }>;
  summary?: string | null;
}): string {
  const generatedTime = new Date().toUTCString();

  const summarySection = summary
    ? `
    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h3 style="margin-top: 0; color: #166534; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Broadcast Summary</h3>
      <p style="margin: 0; color: #14532d; line-height: 1.6; font-size: 14px;">${summary.replace(/\n/g, "<br>")}</p>
    </div>
  `
    : "";

  const turnsRows = turns.length > 0
    ? turns
        .slice(-30) // Take up to latest 30 turns for readability
        .map((t, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding: 10px 12px; font-family: monospace; font-size: 11px; color: #64748b; vertical-align: top; white-space: nowrap;">
          ${t.timestamp || `#${idx + 1}`}
        </td>
        <td style="padding: 10px 12px; font-size: 13px; color: #334155; vertical-align: top; line-height: 1.5;">
          ${t.originalText}
        </td>
        <td style="padding: 10px 12px; font-size: 13px; font-weight: 500; color: #0f172a; vertical-align: top; line-height: 1.5; background-color: #f0fdf4;">
          ${t.translatedText}
        </td>
      </tr>
    `)
        .join("")
    : `<tr><td colspan="3" style="padding: 16px; text-align: center; color: #94a3b8; font-style: italic;">No transcript turns recorded in this session.</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>World Radio Broadcast Digest</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <tr>
      <td style="padding: 24px 28px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px;">
                Radio Broadcast Digest
              </span>
              <h1 style="margin: 4px 0 6px 0; font-size: 22px; font-weight: 700; color: #ffffff;">${stationName}</h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                Origin: <strong>${stationCountry || "International"}</strong> | Native: <strong>${stationLanguage || "Foreign"}</strong> &rarr; Target: <strong style="color: #34d399;">${targetLanguage}</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 24px 28px;">
        ${summarySection}

        <h3 style="margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
          Live Transcript &amp; Translations (${turns.length} turns)
        </h3>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
              <th style="padding: 10px 12px; width: 70px;">Time</th>
              <th style="padding: 10px 12px;">Original Broadcast</th>
              <th style="padding: 10px 12px;">Target Translation (${targetLanguage})</th>
            </tr>
          </thead>
          <tbody>
            ${turnsRows}
          </tbody>
        </table>

        ${
          streamUrl
            ? `
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
            Direct Stream: <a href="${streamUrl}" style="color: #0284c7; text-decoration: underline;" target="_blank" rel="noreferrer">${streamUrl}</a>
          </p>
        `
            : ""
        }
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
        Exported from <strong>World Radio &amp; Podcast Translator</strong> on ${generatedTime}.
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
