import type { Metadata } from "next";
import { ServicesList } from "@/components/marketing/services-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Coiffure homme", description: "Coupes homme, barbe, contours et soins chez ell’o à Genève.", alternates: { canonical: "/lui" } };
export default function LuiPage() { return <ServicesList audience="MALE" />; }
