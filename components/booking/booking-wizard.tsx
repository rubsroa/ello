"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { frCH } from "date-fns/locale";
import { Check, ChevronLeft, Clock3, LoaderCircle, Scissors } from "lucide-react";
import { formatChf } from "@/lib/utils";

type Staff = { id: string; firstName: string; lastName: string; title: string; portraitUrl: string | null };
type Service = { id: string; name: string; description: string | null; durationMinutes: number; priceCents: number; staff: { staff: Staff; customPrice: number | null; customDuration: number | null }[] };
type Category = { id: string; name: string; audience: "FEMALE" | "MALE" | "UNISEX"; services: Service[] };
type Slot = { staffId: string; staffName: string; startsAt: string };

const labels = ["Prestation", "Coiffeur", "Date", "Heure", "Coordonnées", "Validation", "Confirmation"];
const customerFields = [
  { name: "firstName", label: "Prénom", type: "text", autoComplete: "given-name" },
  { name: "lastName", label: "Nom", type: "text", autoComplete: "family-name" },
  { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
  { name: "phone", label: "Téléphone", type: "tel", autoComplete: "tel" },
] as const;

export function BookingWizard({
  initialServiceId,
  endpoint = "/api/bookings",
}: {
  initialServiceId?: string;
  endpoint?: "/api/bookings" | "/api/admin/bookings";
}) {
  const [step, setStep] = useState(initialServiceId ? 2 : 1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [maximumAdvanceDays, setMaximumAdvanceDays] = useState(90);
  const [audience, setAudience] = useState<"FEMALE" | "MALE">("FEMALE");
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [staffId, setStaffId] = useState<string>("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", notes: "", marketingConsent: false });
  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    fetch("/api/services").then(async (response) => {
      if (!response.ok) throw new Error("Impossible de charger les prestations");
      const body = await response.json() as { categories: Category[]; bookingPolicy?: { maximumAdvanceDays: number } };
      setCategories(body.categories);
      if (body.bookingPolicy?.maximumAdvanceDays) setMaximumAdvanceDays(body.bookingPolicy.maximumAdvanceDays);
      const initialCategory = body.categories.find((category) => category.services.some((service) => service.id === initialServiceId));
      if (initialCategory?.audience === "MALE") setAudience("MALE");
      if (initialServiceId && !body.categories.some((category) => category.services.some((service) => service.id === initialServiceId))) setStep(1);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Erreur de chargement")).finally(() => setLoadingServices(false));
  }, [initialServiceId]);

  const service = useMemo(() => categories.flatMap((category) => category.services).find((item) => item.id === serviceId), [categories, serviceId]);
  const selectedSlot = slots.find((slot) => slot.startsAt === startsAt && (!staffId || slot.staffId === staffId));
  const staff = service?.staff.find((link) => link.staff.id === (selectedSlot?.staffId ?? staffId))?.staff;
  const selectedPrice = service?.staff.find((link) => link.staff.id === (selectedSlot?.staffId ?? staffId))?.customPrice ?? service?.priceCents;
  const groupedSlots = useMemo(() => Object.entries(Object.groupBy(slots.filter((slot) => !staffId || slot.staffId === staffId), (slot) => new Date(slot.startsAt).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" }))), [slots, staffId]);

  async function loadSlots(selectedDate: string) {
    if (!serviceId) return;
    setLoadingSlots(true); setError(""); setStartsAt("");
    const params = new URLSearchParams({ serviceId, date: selectedDate });
    if (staffId) params.set("staffId", staffId);
    try {
      const response = await fetch(`/api/availability?${params}`);
      const body = await response.json() as { slots?: Slot[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Impossible de charger les créneaux");
      setSlots(body.slots ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erreur de disponibilité"); }
    finally { setLoadingSlots(false); }
  }

  function chooseService(id: string) { setServiceId(id); setStaffId(""); setDate(""); setSlots([]); setStep(2); }
  function chooseAudience(nextAudience: "FEMALE" | "MALE") { setAudience(nextAudience); setServiceId(""); setStaffId(""); setDate(""); setSlots([]); }
  function chooseStaff(id: string) { setStaffId(id); setDate(""); setSlots([]); setStep(3); }

  async function submitBooking() {
    if (!service || !selectedSlot) return;
    setSubmitting(true); setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, staffId: selectedSlot.staffId, startsAt: selectedSlot.startsAt, customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, marketingConsent: form.marketingConsent }, notes: form.notes || undefined, idempotencyKey: idempotencyKey.current }),
      });
      const body = await response.json() as { reference?: string; checkoutUrl?: string; error?: string };
      if (!response.ok || !body.reference) throw new Error(body.error ?? "La réservation n’a pas pu être créée");
      if (body.checkoutUrl) { window.location.assign(body.checkoutUrl); return; }
      setReference(body.reference); setStep(7);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erreur de réservation"); }
    finally { setSubmitting(false); }
  }

  if (loadingServices) return <div className="flex min-h-[25rem] items-center justify-center"><LoaderCircle className="animate-spin" aria-label="Chargement" /></div>;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        <ol className="mb-10 flex gap-1" aria-label="Étapes de réservation">
          {labels.map((label, index) => <li key={label} className="flex-1"><span className={`block h-1 ${index + 1 <= step ? "bg-brass" : "bg-night/12"}`} /><span className="sr-only">{index + 1}. {label}</span></li>)}
        </ol>
        <p className="eyebrow text-brass">Étape {step} sur 7</p>
        <h2 className="mt-3 font-display text-3xl font-light tracking-[-.03em] sm:text-5xl">{labels[step - 1]}</h2>
        {error && <div role="alert" className="mt-6 border border-red-700/25 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>}

        {step === 1 && <div className="mt-8"><div className="grid grid-cols-2 border border-night/15 bg-white p-1" role="group" aria-label="Choisir un univers"><button type="button" aria-pressed={audience === "FEMALE"} onClick={() => chooseAudience("FEMALE")} className={`min-h-12 text-sm uppercase tracking-[.14em] ${audience === "FEMALE" ? "bg-night text-ivory" : "text-night"}`}>Elle</button><button type="button" aria-pressed={audience === "MALE"} onClick={() => chooseAudience("MALE")} className={`min-h-12 text-sm uppercase tracking-[.14em] ${audience === "MALE" ? "bg-night text-ivory" : "text-night"}`}>Lui</button></div><div className="mt-8 space-y-10">{categories.filter((category) => category.audience === audience || category.audience === "UNISEX").map((category) => <section key={category.id}><h3 className="eyebrow mb-4 text-night/50">{category.name}</h3><div className="grid gap-3">{category.services.map((item) => <button type="button" key={item.id} onClick={() => chooseService(item.id)} className="grid w-full grid-cols-[1fr_auto] gap-4 border border-night/15 bg-white p-5 text-left transition hover:border-night focus-visible:border-night"><span><span className="block text-lg font-normal">{item.name}</span><span className="mt-1 block text-sm text-night/55">{item.durationMinutes} min</span></span><span className="font-normal">{formatChf(item.priceCents)}</span></button>)}</div></section>)}</div></div>}

        {step === 2 && service && <div className="mt-8 grid gap-3"><button type="button" onClick={() => chooseStaff("")} className="border border-night/15 bg-white p-5 text-left transition hover:border-night"><span className="block text-lg font-normal">Premier disponible</span><span className="mt-1 block text-sm text-night/55">Le créneau le plus proche avec l’équipe</span></button>{service.staff.map((link) => <button type="button" key={link.staff.id} onClick={() => chooseStaff(link.staff.id)} className="border border-night/15 bg-white p-5 text-left transition hover:border-night"><span className="block text-lg font-normal">{link.staff.firstName} {link.staff.lastName}</span><span className="mt-1 block text-sm text-night/55">{link.staff.title}</span></button>)}</div>}

        {step === 3 && <div className="mt-8"><label className="eyebrow block text-night/60" htmlFor="booking-date">Choisir une date</label><input id="booking-date" type="date" min={format(new Date(), "yyyy-MM-dd")} max={format(addDays(new Date(), maximumAdvanceDays), "yyyy-MM-dd")} value={date} onChange={(event) => { setDate(event.target.value); void loadSlots(event.target.value); setStep(4); }} className="mt-3 min-h-14 w-full border border-night/20 bg-white px-4 text-lg sm:max-w-sm" /></div>}

        {step === 4 && <div className="mt-8">{loadingSlots ? <LoaderCircle className="animate-spin" aria-label="Chargement des créneaux" /> : groupedSlots.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{groupedSlots.map(([time, matching]) => { const slot = matching?.[0]; if (!slot) return null; return <button type="button" key={`${time}-${slot.staffId}`} onClick={() => { setStartsAt(slot.startsAt); setStep(5); }} className="border border-night/20 bg-white px-4 py-4 font-normal transition hover:border-night">{time}<span className="mt-1 block text-xs font-light text-night/50">{slot.staffName}</span></button>; })}</div> : <p className="text-night/65">Aucun créneau disponible ce jour. Essayez une autre date.</p>}</div>}

        {step === 5 && <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); setStep(6); }}>{customerFields.map((field) => <label key={field.name} className="text-sm font-normal">{field.label}<input required name={field.name} type={field.type} autoComplete={field.autoComplete} value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} className="mt-2 min-h-13 w-full border border-night/20 bg-white px-4 font-light" /></label>)}<label className="text-sm font-normal sm:col-span-2">Message facultatif<textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-2 w-full border border-night/20 bg-white p-4 font-light" /></label><label className="flex items-start gap-3 text-sm font-light sm:col-span-2"><input type="checkbox" checked={form.marketingConsent} onChange={(event) => setForm({ ...form, marketingConsent: event.target.checked })} className="mt-1" />Je souhaite recevoir occasionnellement les nouvelles d’ell’o. Ce consentement est facultatif.</label><button className="button bg-night text-ivory sm:col-span-2" type="submit">Vérifier mon rendez-vous</button></form>}

        {step === 6 && <div className="mt-8"><p className="text-night/65">Vérifiez les détails ci-contre. Le créneau sera contrôlé une dernière fois au moment de la confirmation.</p><button type="button" disabled={submitting} onClick={() => void submitBooking()} className="button mt-8 bg-night text-ivory disabled:opacity-50">{submitting ? <LoaderCircle className="animate-spin" size={17} /> : <Check size={17} />} Confirmer le rendez-vous</button></div>}

        {step === 7 && <div className="mt-8 border border-brass/40 bg-white p-7 sm:p-10"><Check className="text-brass" size={32} /><h3 className="mt-5 font-display text-3xl font-light">Votre rendez-vous est confirmé.</h3><p className="mt-4 text-night/65">Référence <strong className="font-normal text-night">{reference}</strong>. Les détails vous sont envoyés par e-mail.</p></div>}

        {step > 1 && step < 7 && <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="mt-10 inline-flex items-center gap-2 text-xs font-normal uppercase tracking-[.14em]"><ChevronLeft size={15} /> Retour</button>}
      </div>

      <aside className="h-fit border border-night/15 bg-white p-6 lg:sticky lg:top-8" aria-label="Récapitulatif">
        <p className="eyebrow text-brass">Votre rendez-vous</p>
        {!service ? <p className="mt-5 text-sm text-night/50">Sélectionnez une prestation pour commencer.</p> : <div className="mt-5 space-y-5"><div className="flex gap-3"><Scissors size={18} className="mt-1 text-brass" /><div><p className="font-normal">{service.name}</p><p className="text-sm text-night/55">{service.durationMinutes} min · {selectedPrice != null ? formatChf(selectedPrice) : ""}</p></div></div>{staff && <div><p className="eyebrow text-night/40">Coiffeur</p><p className="mt-1">{staff.firstName} {staff.lastName}</p></div>}{startsAt && <div className="flex gap-3"><Clock3 size={18} className="mt-1 text-brass" /><p>{format(new Date(startsAt), "EEEE d MMMM yyyy 'à' HH:mm", { locale: frCH })}</p></div>}</div>}
      </aside>
    </div>
  );
}
