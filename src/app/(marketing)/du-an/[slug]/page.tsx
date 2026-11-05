import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Layers, Calendar, CheckCircle2, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { projectsData } from "@/data/projects";
import { constructMetadata } from "@/lib/metadata";
import { getButtonClassName } from "@/components/ui/button";

interface ProjectDetailPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return projectsData.map((project) => ({
    slug: project.slug,
  }));
}

export function generateMetadata({ params }: ProjectDetailPageProps): Metadata {
  const project = projectsData.find((p) => p.slug === params.slug);

  if (!project) {
    return constructMetadata({ title: "Không tìm thấy dự án" });
  }

  return constructMetadata({
    title: project.title,
    description: project.summary,
  });
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const project = projectsData.find((p) => p.slug === params.slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <PageHero
        title={project.title}
        description={project.summary}
        breadcrumbs={[{ title: "Dự án", href: "/du-an" }, { title: project.title }]}
      />

      <section className="bg-background py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-4xl space-y-10">
            {/* Ảnh đại diện dự án */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-xl">
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover"
              />
            </div>

            {/* Thông số tổng quan */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-4">
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Địa điểm
                </span>
                <p className="text-sm font-semibold text-foreground">{project.location}</p>
              </div>

              <div className="space-y-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Quy mô
                </span>
                <p className="text-sm font-semibold text-foreground">{project.scale}</p>
              </div>

              <div className="space-y-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Thời gian
                </span>
                <p className="text-sm font-semibold text-foreground">{project.year}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Phân loại</span>
                <Badge variant="accent">{project.category}</Badge>
              </div>
            </div>

            {/* Chi tiết nội dung */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Tổng Quan Triển Khai & Bối Cảnh
              </h2>
              <div className="prose prose-stone space-y-4 leading-relaxed text-muted-foreground">
                <p>{project.description}</p>
                <p>
                  Trong suốt quá trình triển khai, Mộc Farm luôn lấy tiêu chí bảo tồn hệ sinh thái
                  tự nhiên làm tôn chỉ hoạt động. Các kỹ sư nông học tại chỗ liên tục kiểm tra các
                  mẫu nước ngầm, kiểm định hàm lượng mùn vi sinh và theo dõi sát sao chu trình phát
                  triển của từng loại cây trồng.
                </p>
              </div>
            </div>

            {/* Kết quả đạt được */}
            <div className="space-y-4 rounded-2xl border border-border bg-cream/40 p-8">
              <h3 className="font-heading text-xl font-bold text-foreground">
                Kết Quả & Tác Động Bền Vững Đạt Được
              </h3>
              <ul className="space-y-3">
                {project.results.map((result, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-foreground/85">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{result}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nút quay lại */}
            <div className="flex items-center justify-between border-t border-border pt-6">
              <Link
                href="/du-an"
                className={getButtonClassName({
                  variant: "outline",
                  className: "gap-2",
                })}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Xem các dự án khác</span>
              </Link>

              <Link
                href="/lien-he"
                className={getButtonClassName({
                  variant: "default",
                })}
              >
                Hợp tác phát triển mô hình
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
