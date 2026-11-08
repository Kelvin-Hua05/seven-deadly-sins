import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SINS, SIN_COUNT, getAdjacentSins, getSinBySlug } from "@/data/sins";
import { EditorialLayout } from "@/components/layout/EditorialLayout";

type Props = { params: Promise<{ slug: string }> };

export const instant = false;

export function generateStaticParams() {
  return SINS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sin = getSinBySlug(slug);
  if (!sin) return {};
  return {
    title: `${sin.titleEn} ${sin.titleZh} — SEVEN DEADLY SINS`,
    description: sin.supportingEn,
  };
}

export default async function SinPage({ params }: Props) {
  const { slug } = await params;
  const sin = getSinBySlug(slug);
  if (!sin) notFound();

  const { prev, next } = getAdjacentSins(sin.slug);

  return (
    <EditorialLayout
      key={sin.slug}
      sin={sin}
      prev={{ slug: prev.slug, titleZh: prev.titleZh }}
      next={{ slug: next.slug, titleZh: next.titleZh }}
      total={SIN_COUNT}
    />
  );
}