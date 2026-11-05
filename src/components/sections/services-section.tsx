import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { Container } from "@/components/ui/container";
import { servicesData } from "@/data/services";

export function ServicesSection() {
  return (
    <section className="border-b border-border bg-cream/40 py-16 sm:py-20 lg:py-24" id="dich-vu">
      <Container>
        {/* Section Heading */}
        <div className="section-title mb-12 text-center sm:mb-16">
          <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
            <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>Dịch Vụ Nông Nghiệp</span>
          </h5>
          <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Giải Pháp Nông Nghiệp Hữu Cơ Toàn Diện
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Chúng tôi kết hợp tri thức nông học truyền thống với công nghệ sinh thái hiện đại để
            đồng hành cùng nhà nông và đối tác trên cả nước.
          </p>
        </div>

        {/* Services Grid  */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {servicesData.map((service, index) => {
            const formattedNumber = (index + 1).toString().padStart(2, "0");

            return (
              <div
                key={service.id}
                className="service-item flex flex-col justify-between border border-border p-6 shadow-sm"
              >
                <div>
                  {/* Image with Floating Number Badge */}
                  <div className="relative mb-5 aspect-[16/11] w-full overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={service.imageUrl}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                      className="object-cover"
                    />
                    <div className="service-badge absolute left-3 top-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/55 text-lg font-bold text-white backdrop-blur-sm transition-colors">
                      {formattedNumber}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mb-3 text-xl font-bold leading-snug text-foreground">
                    {service.title}
                  </h3>

                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    {service.shortDescription}
                  </p>
                </div>

                {/* Button */}
                <div className="pt-2">
                  <Link
                    href={`/dich-vu#${service.slug}`}
                    className="btn-custom btn-custom-gold text-sm font-bold text-dark"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
