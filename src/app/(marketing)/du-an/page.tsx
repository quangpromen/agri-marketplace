import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Layers, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { projectsData } from "@/data/projects";
import { constructMetadata } from "@/lib/metadata";

export const metadata: Metadata = constructMetadata({
  title: "Dự Án Nông Trại Hữu Cơ Điển Hình",
  description:
    "Danh sách các mô hình nông nghiệp sinh thái, cánh đồng mẫu lớn và vườn cây đặc sản do Mộc Farm triển khai trên khắp Việt Nam.",
});

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        title="Dự Án Nông Trại Mộc Farm"
        description="Khám phá các vùng trồng tiêu biểu đang được vận hành theo tiêu chuẩn canh tác hữu cơ sinh thái."
        breadcrumbs={[{ title: "Dự án" }]}
      />

      <section className="bg-background py-16 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {projectsData.map((project) => (
              <div
                key={project.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-4 top-4">
                    <Badge variant="accent" className="font-semibold shadow-sm">
                      {project.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between space-y-4 p-6 sm:p-8">
                  <div>
                    <div className="mb-3 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        {project.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        Quy mô: {project.scale}
                      </span>
                    </div>

                    <h2 className="font-heading text-xl font-bold text-foreground transition-colors group-hover:text-primary sm:text-2xl">
                      {project.title}
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {project.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs font-semibold text-secondary-foreground/80">
                      Giai đoạn: {project.year}
                    </span>
                    <Link
                      href={`/du-an/${project.slug}`}
                      className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
                    >
                      <span>Xem chi tiết dự án</span>
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
