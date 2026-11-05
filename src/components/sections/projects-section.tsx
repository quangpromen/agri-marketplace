"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { projectsData } from "@/data/projects";
import { cn } from "@/lib/utils";

export function ProjectsSection() {
  const [activeId, setActiveId] = useState(projectsData[0]?.id || "nong-trai-da-lat");

  const activeProject = projectsData.find((p) => p.id === activeId) || projectsData[0];

  return (
    <section className="border-b border-border bg-white py-16 sm:py-20 lg:py-24" id="du-an">
      <Container>
        {/* Section Heading */}
        <div className="section-title mb-12 text-center sm:mb-16">
          <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
            <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>Dự Án Tiêu Biểu</span>
          </h5>
          <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Các Vùng Trồng Điển Hình Của Mộc Farm
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Những mô hình nông nghiệp sinh thái tuần hoàn kiểu mẫu đang mang lại giá trị bền vững
            cho đất mẹ và cộng đồng nông dân địa phương.
          </p>
        </div>

        {/* Project Layout  */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Column: Vertical Tab Pill Buttons (col-lg-4 col-xl-3) */}
          <div className="flex flex-col space-y-4 lg:col-span-4 xl:col-span-3" role="tablist">
            {projectsData.map((project, index) => {
              const isActive = project.id === activeId;
              const formattedNumber = (index + 1).toString().padStart(2, "0");

              return (
                <button
                  key={project.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(project.id)}
                  className={cn(
                    "focus-ring group relative h-24 w-full cursor-pointer overflow-hidden rounded-2xl text-left shadow-sm transition-all duration-300",
                    isActive
                      ? "scale-[1.02] shadow-md ring-2 ring-accent"
                      : "opacity-85 hover:opacity-100"
                  )}
                >
                  {/* Background Thumbnail Image */}
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    sizes="300px"
                    className={cn(
                      "object-cover transition-all duration-500",
                      isActive ? "filter-none" : "blur-[2px] group-hover:filter-none"
                    )}
                  />

                  {/* Dark Overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center px-5 transition-colors",
                      isActive ? "bg-black/45" : "bg-black/60 group-hover:bg-black/45"
                    )}
                  >
                    <h3 className="text-base font-bold tracking-tight text-white drop-shadow-sm sm:text-lg">
                      {formattedNumber}. {project.title.split(" - ")[0]}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Project Details (col-lg-8 col-xl-9) */}
          <div className="rounded-2xl border border-border bg-cream/50 p-6 shadow-sm sm:p-10 lg:col-span-8 xl:col-span-9">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
              {/* Left Featured Image (col-md-5) */}
              <div className="md:col-span-5">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-md md:aspect-square">
                  <Image
                    src={activeProject.imageUrl}
                    alt={activeProject.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                  />
                  <div className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-dark shadow-sm">
                    {activeProject.scale} • {activeProject.location}
                  </div>
                </div>
              </div>

              {/* Right Content (col-md-7) */}
              <div className="space-y-4 md:col-span-7">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  {activeProject.category}
                </span>

                <h3 className="text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
                  {activeProject.title}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {activeProject.description}
                </p>

                {/* Results Checkmarks */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-bold text-foreground">Điểm nổi bật của dự án:</h4>
                  <ul className="space-y-2 text-xs text-foreground/85 sm:text-sm">
                    {activeProject.results.slice(0, 3).map((res, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 font-bold text-accent"
                          aria-hidden="true"
                        />
                        <span>{res}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4">
                  <Link
                    href={`/du-an/${activeProject.slug}`}
                    className="btn-custom btn-custom-gold text-sm font-bold text-dark shadow-md"
                  >
                    Xem chi tiết dự án
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
