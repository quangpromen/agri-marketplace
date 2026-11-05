import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { postsData } from "@/data/posts";
import { constructMetadata } from "@/lib/metadata";
import { getButtonClassName } from "@/components/ui/button";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return postsData.map((post) => ({
    slug: post.slug,
  }));
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = postsData.find((p) => p.slug === params.slug);

  if (!post) {
    return constructMetadata({ title: "Không tìm thấy bài viết" });
  }

  return constructMetadata({
    title: post.title,
    description: post.summary,
  });
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = postsData.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <PageHero
        title={post.title}
        breadcrumbs={[{ title: "Bài viết", href: "/bai-viet" }, { title: post.title }]}
      />

      <section className="bg-background py-16 sm:py-24">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8">
            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-border bg-muted">
                  <Image
                    src={post.author.avatarUrl}
                    alt={post.author.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{post.author.name}</h3>
                  <p className="text-xs text-muted-foreground">{post.author.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
                  {post.publishedAt}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                  {post.readTime}
                </span>
              </div>
            </div>

            {/* Ảnh đại diện bài viết */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 768px"
                className="object-cover"
              />
            </div>

            {/* Tóm tắt mở đầu */}
            <p className="border-l-4 border-primary py-1 pl-4 text-lg font-medium italic leading-relaxed text-foreground/90">
              {post.summary}
            </p>

            {/* Nội dung chi tiết */}
            <div className="prose prose-stone space-y-5 text-base leading-relaxed text-foreground/85">
              <p>{post.content}</p>
              <p>
                Nông nghiệp tự nhiên không đòi hỏi con người phải chiến đấu chống lại sâu bệnh hay
                cỏ dại, mà cần sự thấu hiểu quy luật tự nhiên. Khi đất được cung cấp đủ mùn hữu cơ
                và độ ẩm, các sinh vật có ích sẽ tạo thành tấm khiên chắn tự nhiên bảo vệ bộ rễ cây
                trồng phát triển mạnh mẽ.
              </p>
              <p>
                Tại Mộc Farm, chúng tôi tự hào khi mỗi sản phẩm nông sản giao tới tay người tiêu
                dùng đều mang trọn vẹn sự thuần khiết và tình yêu với mảnh đất quê hương Việt Nam.
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-6">
              <Tag className="mr-1 h-4 w-4 text-primary" aria-hidden="true" />
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Điều hướng quay lại */}
            <div className="flex items-center justify-between pt-8">
              <Link
                href="/bai-viet"
                className={getButtonClassName({
                  variant: "outline",
                  className: "gap-2",
                })}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Xem tất cả bài viết</span>
              </Link>
            </div>
          </article>
        </Container>
      </section>
    </>
  );
}
