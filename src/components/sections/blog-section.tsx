import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { Container } from "@/components/ui/container";
import { postsData } from "@/data/posts";

export function BlogSection() {
  return (
    <section className="border-b border-border bg-cream/40 py-16 sm:py-20 lg:py-24" id="bai-viet">
      <Container>
        {/* Section Heading */}
        <div className="section-title mb-12 text-center sm:mb-16">
          <h5 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent sm:text-base">
            <Leaf className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>Tin Tức & Kiến Thức</span>
          </h5>
          <h2 className="text-2xl font-extrabold leading-[1.2] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Góc Nhìn Nông Nghiệp & Cẩm Nang Sống Lành
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Những bài viết chia sẻ kinh nghiệm chọn nông sản sạch, kỹ thuật ủ phân sinh học và câu
            chuyện chân thực từ ruộng đồng Việt.
          </p>
        </div>

        {/* 3 Columns  */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {postsData.map((post) => (
            <div
              key={post.id}
              className="blog-item flex flex-col justify-between border border-border p-6 shadow-sm sm:p-7"
            >
              <div>
                {/* Meta Row: Date - Rule - Category */}
                <div className="mb-4 flex items-center justify-center gap-3 text-xs font-semibold text-muted-foreground">
                  <span>{post.publishedAt}</span>
                  <span className="inline-block h-0.5 w-8 bg-accent" aria-hidden="true" />
                  <span className="text-accent">{post.category}</span>
                </div>

                {/* Centered Heading */}
                <Link
                  href={`/bai-viet/${post.slug}`}
                  className="mb-5 block text-center text-lg font-bold leading-snug text-foreground transition-colors hover:text-accent sm:text-xl"
                >
                  {post.title}
                </Link>
              </div>

              {/* Bottom Image Container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
