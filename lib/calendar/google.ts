import "server-only";
import { google } from "googleapis";
import { db } from "@/lib/db/client";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import { getServerConfig } from "@/lib/config";
import type { CalendarBusyReader, CalendarWriter } from "@/lib/calendar/types";

function oauthClient() {
  const config = getServerConfig();
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET || !config.GOOGLE_REDIRECT_URI) throw new Error("Google Calendar n’est pas configuré");
  return new google.auth.OAuth2(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI);
}

async function authorizedClient(staffId: string) {
  const connection = await db.calendarConnection.findUnique({ where: { staffId } });
  if (!connection?.active || !connection.encryptedRefreshToken) return null;
  const client = oauthClient();
  client.setCredentials({
    refresh_token: decryptSecret(connection.encryptedRefreshToken),
    access_token: connection.encryptedAccessToken ? decryptSecret(connection.encryptedAccessToken) : undefined,
    expiry_date: connection.tokenExpiresAt?.getTime(),
  });
  client.on("tokens", async (tokens) => {
    await db.calendarConnection.update({
      where: { staffId },
      data: {
        encryptedAccessToken: tokens.access_token ? encryptSecret(tokens.access_token) : undefined,
        encryptedRefreshToken: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : undefined,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    });
  });
  return { client, connection };
}

export function googleAuthorizationUrl(state: string) {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.freebusy"],
    state,
  });
}

export async function exchangeGoogleCode(staffId: string, code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) throw new Error("Google n’a pas renvoyé de refresh token");
  client.setCredentials(tokens);
  const calendar = google.calendar({ version: "v3", auth: client });
  const selected = await calendar.calendarList.get({ calendarId: "primary" });
  await db.calendarConnection.upsert({
    where: { staffId },
    create: {
      staffId,
      calendarId: "primary",
      encryptedAccessToken: tokens.access_token ? encryptSecret(tokens.access_token) : null,
      encryptedRefreshToken: encryptSecret(tokens.refresh_token),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      connectedEmail: selected.data.id ?? null,
      scopes: tokens.scope?.split(" ") ?? [],
    },
    update: {
      active: true,
      encryptedAccessToken: tokens.access_token ? encryptSecret(tokens.access_token) : undefined,
      encryptedRefreshToken: encryptSecret(tokens.refresh_token),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      connectedEmail: selected.data.id ?? undefined,
      scopes: tokens.scope?.split(" ") ?? undefined,
      lastError: null,
    },
  });
}

export const googleCalendarProvider: CalendarBusyReader & CalendarWriter = {
  async getBusyIntervals(staffId, start, end) {
    const authorized = await authorizedClient(staffId);
    if (!authorized) return [];
    const calendar = google.calendar({ version: "v3", auth: authorized.client });
    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          timeZone: "Europe/Zurich",
          items: [{ id: authorized.connection.calendarId }],
        },
      });
      await db.calendarConnection.update({ where: { staffId }, data: { lastSyncedAt: new Date(), lastError: null } });
      return (response.data.calendars?.[authorized.connection.calendarId]?.busy ?? []).flatMap((busy) => busy.start && busy.end ? [{ start: new Date(busy.start), end: new Date(busy.end) }] : []);
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Erreur Google Calendar";
      await db.calendarConnection.update({ where: { staffId }, data: { lastError: message } });
      throw new Error("Impossible de vérifier le calendrier du coiffeur");
    }
  },

  async createBookingEvent(bookingId) {
    const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { customer: true, service: true, staff: true } });
    if (!booking) throw new Error("Rendez-vous introuvable");
    const authorized = await authorizedClient(booking.staffId);
    if (!authorized) return;
    const calendar = google.calendar({ version: "v3", auth: authorized.client });
    try {
      const event = await calendar.events.insert({
        calendarId: authorized.connection.calendarId,
        sendUpdates: "none",
        requestBody: {
          summary: `${booking.service.name} — ${booking.customer.firstName} ${booking.customer.lastName}`,
          description: `Réservation ${booking.reference}\nTéléphone: ${booking.customer.phone}`,
          start: { dateTime: booking.startsAt.toISOString(), timeZone: "Europe/Zurich" },
          end: { dateTime: booking.endsAt.toISOString(), timeZone: "Europe/Zurich" },
          extendedProperties: { private: { elloBookingId: booking.id } },
        },
      });
      if (!event.data.id) throw new Error("Google n’a pas renvoyé d’identifiant d’événement");
      await db.calendarEventMapping.upsert({
        where: { bookingId },
        create: { bookingId, staffId: booking.staffId, calendarId: authorized.connection.calendarId, calendarEventId: event.data.id, syncStatus: "SYNCED", lastSyncedAt: new Date() },
        update: { staffId: booking.staffId, calendarId: authorized.connection.calendarId, calendarEventId: event.data.id, syncStatus: "SYNCED", lastSyncedAt: new Date(), lastError: null },
      });
    } catch (error) {
      await recordCalendarFailure(bookingId, booking.staffId, authorized.connection.calendarId, error);
    }
  },

  async updateBookingEvent(bookingId) {
    const mapping = await db.calendarEventMapping.findUnique({ where: { bookingId }, include: { booking: { include: { customer: true, service: true } } } });
    if (!mapping) return this.createBookingEvent(bookingId);
    if (mapping.staffId !== mapping.booking.staffId) {
      const previous = await authorizedClient(mapping.staffId);
      if (previous) {
        try {
          await google.calendar({ version: "v3", auth: previous.client }).events.delete({ calendarId: mapping.calendarId, eventId: mapping.calendarEventId, sendUpdates: "none" });
        } catch (error) {
          await recordCalendarFailure(bookingId, mapping.staffId, mapping.calendarId, error);
          return;
        }
      }
      await db.calendarEventMapping.delete({ where: { bookingId } });
      return this.createBookingEvent(bookingId);
    }
    const authorized = await authorizedClient(mapping.staffId);
    if (!authorized) return;
    try {
      await google.calendar({ version: "v3", auth: authorized.client }).events.update({
        calendarId: mapping.calendarId,
        eventId: mapping.calendarEventId,
        sendUpdates: "none",
        requestBody: {
          summary: `${mapping.booking.service.name} — ${mapping.booking.customer.firstName} ${mapping.booking.customer.lastName}`,
          start: { dateTime: mapping.booking.startsAt.toISOString(), timeZone: "Europe/Zurich" },
          end: { dateTime: mapping.booking.endsAt.toISOString(), timeZone: "Europe/Zurich" },
          extendedProperties: { private: { elloBookingId: bookingId } },
        },
      });
      await db.calendarEventMapping.update({ where: { bookingId }, data: { syncStatus: "SYNCED", lastSyncedAt: new Date(), lastError: null } });
    } catch (error) {
      await recordCalendarFailure(bookingId, mapping.staffId, mapping.calendarId, error);
    }
  },

  async deleteBookingEvent(bookingId) {
    const mapping = await db.calendarEventMapping.findUnique({ where: { bookingId } });
    if (!mapping) return;
    const authorized = await authorizedClient(mapping.staffId);
    if (!authorized) return;
    try {
      await google.calendar({ version: "v3", auth: authorized.client }).events.delete({ calendarId: mapping.calendarId, eventId: mapping.calendarEventId, sendUpdates: "none" });
      await db.calendarEventMapping.update({ where: { bookingId }, data: { syncStatus: "DELETED", lastSyncedAt: new Date(), lastError: null } });
    } catch (error) {
      await recordCalendarFailure(bookingId, mapping.staffId, mapping.calendarId, error);
    }
  },
};

async function recordCalendarFailure(bookingId: string, staffId: string, calendarId: string, error: unknown) {
  const message = error instanceof Error ? error.message.slice(0, 1000) : "Erreur Google Calendar";
  await db.calendarEventMapping.upsert({
    where: { bookingId },
    create: { bookingId, staffId, calendarId, calendarEventId: `pending-${bookingId}`, syncStatus: "FAILED", lastError: message },
    update: { syncStatus: "FAILED", lastError: message },
  });
}
