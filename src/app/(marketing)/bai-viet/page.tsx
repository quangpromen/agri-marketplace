import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { postsData } from "@/data/posts";
import { constructMetadata } from "@/lib/metadata";

export const metadata: Metadata = constructMetadata({
  title: "Bài Viết & Cẩm Nang Nông Nghiệp Hữu Cơ",
  description:
    "Góc chia sẻ kiến thức chọn nông sản sạch, cẩm nang canh tác sinh thái và tin tức mùa vụ mới nhất từ nông trại Mộc Farm.",
});

export default function BlogPage() {
  return (
    <>
      <PageHero
        title="Góc Nhìn Nông Nghiệp & Sống Lành"
        description="Những câu chuyện từ đồng ruộng, bí quyết chọn thực phẩm sạch và kiến thức nông nghiệp hữu cơ."
        breadcrumbs={[{ title: "Bài viết" }]}
      />

      <section className="bg-background py-16 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {postsData.map((post) => (
              <Card
                key={post.id}
                className="group flex flex-col overflow-hidden border border-border bg-card transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-4 top-4">
                    <Badge variant="default" className="shadow-sm">
                      {post.category}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="flex-1 space-y-3">
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {post.publishedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {post.readTime}
                    </span>
                  </div>

                  <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary sm:text-xl">
                    <Link href={`/bai-viet/${post.slug}`}>{post.title}</Link>
                  </CardTitle>

                  <CardDescription className="line-clamp-2">{post.summary}</CardDescription>
                </CardHeader>

                <CardFooter className="mt-auto border-t border-border pt-0">
                  <div className="flex w-full items-center justify-between pt-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      <span>{post.author.name}</span>
                    </div>

                    <Link
                      href={`/bai-viet/${post.slug}`}
                      className="focus-ring inline-flex items-center gap-1 rounded text-xs font-bold text-primary hover:text-primary-dark"
                    >
                      <span>Đọc tiếp</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
