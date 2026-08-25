import type { Metadata } from "next";
import { ServicesList } from "@/components/marketing/services-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Coiffure femme", description: "Coupes, couleurs, balayages et soins femme chez ell’o à Genève.", alternates: { canonical: "/elle" } };
export default function EllePage() { return <ServicesList audience="FEMALE" />; }
