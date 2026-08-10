/* Lead logging to Airtable (per IT guidance: log everything to a DB, then
   email). This writes to a DEDICATED leads base, never the Compendium base:
   its People/Profile/Headshots structure is off-limits (IT hard rule).

   Inert until the env carries LEADS_API_TOKEN + LEADS_BASE_ID +
   LEADS_TABLE_ID. Failures never fail the visitor's request; email is the
   primary channel and this is the paper trail. */

export interface LeadsEnv {
  LEADS_API_TOKEN?: string;
  LEADS_BASE_ID?: string;
  LEADS_TABLE_ID?: string;
  /** 'AME' | 'AOE': one shared base logs both sites' leads. */
  LEADS_COMPANY?: string;
}

export interface Lead {
  Type: 'Inquiry' | 'Estimate';
  Name?: string;
  Contact?: string;
  Role?: string;
  City?: string;
  Timeline?: string;
  Amount?: number;
  Summary?: string;
}

export async function logLead(env: LeadsEnv, lead: Lead): Promise<void> {
  if (!env.LEADS_API_TOKEN || !env.LEADS_BASE_ID || !env.LEADS_TABLE_ID) return;
  try {
    await fetch(`https://api.airtable.com/v0/${env.LEADS_BASE_ID}/${env.LEADS_TABLE_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.LEADS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{ fields: { Status: 'New', Company: env.LEADS_COMPANY || 'AME', ...lead } }],
        typecast: true, // lets Airtable accept new select options like Role values
      }),
    });
  } catch {
    /* the email already went out; the log is best-effort */
  }
}
