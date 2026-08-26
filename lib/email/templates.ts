import { formatInTimeZone } from "date-fns-tz";
import { formatChf } from "@/lib/utils";

type BookingTemplateData = {
  firstName: string;
  reference: string;
  service: string;
  staff: string;
  startsAt: Date;
  priceCents: number;
  depositCents: number;
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);

function shell(content: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#FFFFFF;color:#0E2536;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:40px 24px"><div style="font-size:38px;font-weight:300;letter-spacing:-2px">ell’o</div><div style="margin-top:4px;font-size:10px;letter-spacing:3px;text-transform:uppercase">Coiffure · Genève</div><div style="margin-top:36px;background:#fff;padding:32px">${content}</div><p style="margin-top:28px;font-size:12px;line-height:20px;color:#53616b">Ruelle du Midi 12 · 1207 Genève · +41 76 385 03 40</p></div></body></html>`;
}

export function confirmationTemplate(data: BookingTemplateData) {
  const date = formatInTimeZone(data.startsAt, "Europe/Zurich", "dd.MM.yyyy 'à' HH:mm");
  const remainder = data.priceCents - data.depositCents;
  const content = `<p style="margin:0;color:#B79457;font-size:11px;letter-spacing:2px;text-transform:uppercase">Rendez-vous confirmé</p><h1 style="font-size:30px;font-weight:300">Merci ${escapeHtml(data.firstName)}</h1><p>Votre rendez-vous est réservé.</p><table style="width:100%;margin-top:24px;border-collapse:collapse"><tr><td style="padding:8px 0;color:#66737c">Prestation</td><td style="padding:8px 0;text-align:right">${escapeHtml(data.service)}</td></tr><tr><td style="padding:8px 0;color:#66737c">Avec</td><td style="padding:8px 0;text-align:right">${escapeHtml(data.staff)}</td></tr><tr><td style="padding:8px 0;color:#66737c">Date</td><td style="padding:8px 0;text-align:right">${date}</td></tr><tr><td style="padding:8px 0;color:#66737c">Prix</td><td style="padding:8px 0;text-align:right">${formatChf(data.priceCents)}</td></tr>${data.depositCents ? `<tr><td style="padding:8px 0;color:#66737c">Reste au salon</td><td style="padding:8px 0;text-align:right">${formatChf(remainder)}</td></tr>` : ""}</table><p style="margin-top:28px;font-size:13px;color:#66737c">Référence ${escapeHtml(data.reference)}</p>`;
  return {
    subject: `Votre rendez-vous ell’o — ${date}`,
    html: shell(content),
    text: `Rendez-vous confirmé\n${data.service}\nAvec ${data.staff}\n${date}\nRéférence ${data.reference}`,
  };
}

export function cancellationTemplate(data: BookingTemplateData) {
  const date = formatInTimeZone(data.startsAt, "Europe/Zurich", "dd.MM.yyyy 'à' HH:mm");
  const content = `<p style="margin:0;color:#B79457;font-size:11px;letter-spacing:2px;text-transform:uppercase">Rendez-vous annulé</p><h1 style="font-size:30px;font-weight:300">Bonjour ${escapeHtml(data.firstName)}</h1><p>Votre rendez-vous du ${date} pour ${escapeHtml(data.service)} a bien été annulé.</p><p style="margin-top:28px;font-size:13px;color:#66737c">Référence ${escapeHtml(data.reference)}</p>`;
  return {
    subject: `Annulation de votre rendez-vous ell’o — ${date}`,
    html: shell(content),
    text: `Rendez-vous annulé\n${data.service}\n${date}\nRéférence ${data.reference}`,
  };
}

export function rescheduledTemplate(data: BookingTemplateData) {
  const date = formatInTimeZone(data.startsAt, "Europe/Zurich", "dd.MM.yyyy 'à' HH:mm");
  const content = `<p style="margin:0;color:#B79457;font-size:11px;letter-spacing:2px;text-transform:uppercase">Rendez-vous modifié</p><h1 style="font-size:30px;font-weight:300">Bonjour ${escapeHtml(data.firstName)}</h1><p>Votre nouveau rendez-vous est fixé au <strong>${date}</strong>.</p><p>${escapeHtml(data.service)} avec ${escapeHtml(data.staff)}.</p><p style="margin-top:28px;font-size:13px;color:#66737c">Référence ${escapeHtml(data.reference)}</p>`;
  return {
    subject: `Modification de votre rendez-vous ell’o — ${date}`,
    html: shell(content),
    text: `Rendez-vous modifié\n${data.service}\nAvec ${data.staff}\n${date}\nRéférence ${data.reference}`,
  };
}

export function reminderTemplate(data: BookingTemplateData) {
  const date = formatInTimeZone(data.startsAt, "Europe/Zurich", "dd.MM.yyyy 'à' HH:mm");
  const content = `<p style="margin:0;color:#B79457;font-size:11px;letter-spacing:2px;text-transform:uppercase">Rappel</p><h1 style="font-size:30px;font-weight:300">À demain ${escapeHtml(data.firstName)}</h1><p>Nous vous attendons le <strong>${date}</strong> pour ${escapeHtml(data.service)}, avec ${escapeHtml(data.staff)}.</p><p style="margin-top:28px;font-size:13px;color:#66737c">Référence ${escapeHtml(data.reference)}</p>`;
  return {
    subject: `Rappel de votre rendez-vous ell’o — ${date}`,
    html: shell(content),
    text: `Rappel de rendez-vous\n${data.service}\nAvec ${data.staff}\n${date}\nRéférence ${data.reference}`,
  };
}

export function salonTemplate(data: BookingTemplateData, event: "new" | "cancelled" | "rescheduled" | "paid") {
  const date = formatInTimeZone(data.startsAt, "Europe/Zurich", "dd.MM.yyyy 'à' HH:mm");
  const labels = { new: "Nouveau rendez-vous", cancelled: "Rendez-vous annulé", rescheduled: "Rendez-vous déplacé", paid: "Paiement reçu" } as const;
  const label = labels[event];
  const content = `<p style="margin:0;color:#B79457;font-size:11px;letter-spacing:2px;text-transform:uppercase">Notification salon</p><h1 style="font-size:30px;font-weight:300">${label}</h1><table style="width:100%;margin-top:24px;border-collapse:collapse"><tr><td style="padding:8px 0;color:#66737c">Client</td><td style="padding:8px 0;text-align:right">${escapeHtml(data.firstName)}</td></tr><tr><td style="padding:8px 0;color:#66737c">Prestation</td><td style="padding:8px 0;text-align:right">${escapeHtml(data.service)}</td></tr><tr><td style="padding:8px 0;color:#66737c">Avec</td><td style="padding:8px 0;text-align:right">${escapeHtml(data.staff)}</td></tr><tr><td style="padding:8px 0;color:#66737c">Date</td><td style="padding:8px 0;text-align:right">${date}</td></tr>${event === "paid" ? `<tr><td style="padding:8px 0;color:#66737c">Montant reçu</td><td style="padding:8px 0;text-align:right">${formatChf(data.depositCents)}</td></tr>` : ""}</table><p style="margin-top:28px;font-size:13px;color:#66737c">Référence ${escapeHtml(data.reference)}</p>`;
  return {
    subject: `${label} — ${data.reference}`,
    html: shell(content),
    text: `${label}\n${data.service}\nAvec ${data.staff}\n${date}\nRéférence ${data.reference}`,
  };
}
