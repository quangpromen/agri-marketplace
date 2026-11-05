import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail, Facebook, Linkedin, Leaf } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { teamData } from "@/data/team";
import { constructMetadata } from "@/lib/metadata";

export const metadata: Metadata = constructMetadata({
  title: "Đội Ngũ Chuyên Gia & Kỹ Sư Nông Học - Mộc Farm",
  description:
    "Gặp gỡ đội ngũ chuyên gia thổ nhưỡng, kỹ sư nông học và người làm nông tâm huyết tại Mộc Farm.",
});

export default function TeamPage() {
  return (
    <>
      <PageHero
        title="Đội Ngũ Chuyên Gia Mộc Farm"
        description="Những con người tận tâm, am hiểu sâu sắc về đất mẹ và kỹ thuật canh tác nông nghiệp tuần hoàn sinh thái."
        breadcrumbs={[{ title: "Đội ngũ" }]}
        imageUrl="/images/hero/hero-1.jpg"
      />

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="section-title mb-12 text-center sm:mb-16">
            <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
              <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>Đội Ngũ Tâm Huyết</span>
            </h5>
            <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              Những Người Gieo Mầm Tương Lai
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              Sự kết hợp giữa kinh nghiệm thực nghiệm đồng ruộng và nền tảng nông học bài bản mang
              đến chuẩn mực chất lượng cao nhất cho Mộc Farm.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {teamData.map((member) => (
              <div
                key={member.id}
                className="team-item flex flex-col justify-between border border-border p-6 shadow-sm"
              >
                <div>
                  <div className="relative mb-5 aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={member.avatarUrl}
                      alt={member.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 280px"
                      className="object-cover"
                    />
                  </div>

                  <h3 className="mb-1 text-xl font-bold leading-snug text-foreground">
                    {member.name}
                  </h3>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">
                    {member.role}
                  </p>
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{member.bio}</p>
                </div>

                <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                  {member.socials?.facebook && (
                    <a
                      href={member.socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Facebook của ${member.name}`}
                      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-cream text-dark transition-colors hover:bg-accent"
                    >
                      <Facebook className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  {member.socials?.linkedin && (
                    <a
                      href={member.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`LinkedIn của ${member.name}`}
                      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-cream text-dark transition-colors hover:bg-accent"
                    >
                      <Linkedin className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  {member.socials?.email && (
                    <a
                      href={`mailto:${member.socials.email}`}
                      aria-label={`Email của ${member.name}`}
                      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-cream text-dark transition-colors hover:bg-accent"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
