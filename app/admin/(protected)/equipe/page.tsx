import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { StaffManager } from "@/components/admin/staff-manager";
import { StaffScheduleManager } from "@/components/admin/staff-schedule-manager";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";
export default async function TeamPage() {
  const user = await requireUser(["ADMIN", "STAFF"]);
  const staff = await db.staff.findMany({
    where: user.role === "STAFF" ? { id: user.staff?.id ?? "unassigned" } : undefined,
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, firstName: true, lastName: true, title: true, bio: true, active: true, acceptsOnlineBooking: true,
      calendarConnection: { select: { connectedEmail: true, active: true } },
      services: { select: { serviceId: true } },
      availabilities: { select: { weekday: true, active: true, startsAtMinutes: true, endsAtMinutes: true } },
      timeOff: { where: { endsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, select: { id: true, startsAt: true, endsAt: true, reason: true } },
    },
  });
  const schedules = staff.map((person) => ({
    id: person.id,
    name: `${person.firstName} ${person.lastName}`,
    days: Array.from({ length: 7 }, (_, weekday) => person.availabilities.find((day) => day.weekday === weekday) ?? { weekday, active: false, startsAtMinutes: 9 * 60, endsAtMinutes: 18 * 60 }),
    timeOff: person.timeOff.map((item) => ({ id: item.id, startsAtLocal: formatInTimeZone(item.startsAt, "Europe/Zurich", "yyyy-MM-dd'T'HH:mm"), endsAtLocal: formatInTimeZone(item.endsAt, "Europe/Zurich", "yyyy-MM-dd'T'HH:mm"), reason: item.reason })),
  }));
  const services = user.role === "ADMIN" ? await db.service.findMany({ where: { active: true }, orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }], select: { id: true, name: true, category: { select: { name: true } } } }) : [];
  const staffForManager = staff.map((person) => ({ ...person, serviceIds: person.services.map((item) => item.serviceId) }));
  return <><p className="eyebrow text-brass">Maison</p><h1 className="mt-3 font-display text-4xl font-light tracking-[-.04em]">Équipe</h1>{user.role === "ADMIN" && <StaffManager initialStaff={staffForManager} services={services.map((service) => ({ id: service.id, name: service.name, category: service.category.name }))} />}<StaffScheduleManager initialSchedules={schedules} /></>;
}
