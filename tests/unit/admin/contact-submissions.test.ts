import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  selectDistinct: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: mocks.select,
    selectDistinct: mocks.selectDistinct,
    update: mocks.update,
  },
}));

import { contactSubmissions } from "@/db/schema";
import {
  buildContactSubmissionWhereClause,
  escapeLikePattern,
  getContactSubmissionById,
  listContactSubmissions,
  listDistinctContactServices,
  updateContactSubmissionStatus,
} from "@/server/admin/contact-submissions";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const pgDialect = new PgDialect();

describe("admin contact-submissions database queries", () => {
  beforeEach(() => {
    mocks.select.mockReset();
    mocks.selectDistinct.mockReset();
    mocks.update.mockReset();
  });

  it("escape ký tự wildcard SQL LIKE (%, _, \\) đúng chuẩn", () => {
    expect(escapeLikePattern("100%_test\\name")).toBe("100\\%\\_test\\\\name");
  });

  it("buildContactSubmissionWhereClause tạo điều kiện query parameterized cho tìm kiếm và lọc kết hợp", () => {
    expect(buildContactSubmissionWhereClause({})).toBeUndefined();

    const whereClause = buildContactSubmissionWhereClause({
      q: "100% An",
      status: "contacted",
      emailStatus: "failed",
      service: "hop-rau-tuan",
    });

    expect(whereClause).toBeDefined();
    const compiled = pgDialect.sqlToQuery(whereClause!);

    expect(compiled.sql).toContain('"contact_submissions"."status" = $1');
    expect(compiled.sql).toContain('"contact_submissions"."email_status" = $2');
    expect(compiled.sql).toContain('"contact_submissions"."service" = $3');
    expect(compiled.sql).toContain('"contact_submissions"."name" ilike $4');
    expect(compiled.sql).toContain('"contact_submissions"."email" ilike $5');
    expect(compiled.sql).toContain('"contact_submissions"."phone" ilike $6');
    expect(compiled.params).toEqual([
      "contacted",
      "failed",
      "hop-rau-tuan",
      "%100\\% An%",
      "%100\\% An%",
      "%100\\% An%",
    ]);
  });

  it("buildContactSubmissionWhereClause bổ sung biến thể SĐT bỏ khoảng trắng khi tìm kiếm số điện thoại", () => {
    const whereClause = buildContactSubmissionWhereClause({
      q: "0912 345 678",
    });

    const compiled = pgDialect.sqlToQuery(whereClause!);
    expect(compiled.params).toContain("%0912 345 678%");
    expect(compiled.params).toContain("%0912345678%");
  });

  it("listContactSubmissions chỉ select cột danh sách (không lấy message) và phân trang 20 bản ghi", async () => {
    const sampleItem = {
      id: VALID_UUID,
      name: "Nguyễn Văn An",
      phone: "0912345678",
      email: "an@example.com",
      service: "hop-rau-tuan",
      status: "new" as const,
      emailStatus: "failed" as const,
      createdAt: new Date("2026-11-10T08:00:00Z"),
    };

    const countWhere = vi.fn().mockResolvedValue([{ total: 25 }]);
    const countFrom = vi.fn().mockReturnValue({ where: countWhere });

    const listOffset = vi.fn().mockResolvedValue([sampleItem]);
    const listLimit = vi.fn().mockReturnValue({ offset: listOffset });
    const listOrderBy = vi.fn().mockReturnValue({ limit: listLimit });
    const listWhere = vi.fn().mockReturnValue({ orderBy: listOrderBy });
    const listFrom = vi.fn().mockReturnValue({ where: listWhere });

    mocks.select
      .mockReturnValueOnce({ from: countFrom })
      .mockReturnValueOnce({ from: listFrom });

    const result = await listContactSubmissions({
      q: "an",
      status: "new",
      page: 2,
    });

    const selectedCols = mocks.select.mock.calls[1][0] as Record<string, unknown>;
    expect(Object.keys(selectedCols).sort()).toEqual([
      "createdAt",
      "email",
      "emailStatus",
      "id",
      "name",
      "phone",
      "service",
      "status",
    ]);
    expect("message" in selectedCols).toBe(false);
    expect("updatedAt" in selectedCols).toBe(false);

    expect(listLimit).toHaveBeenCalledWith(20);
    expect(listOffset).toHaveBeenCalledWith(20);
    expect(result).toEqual({
      items: [sampleItem],
      totalCount: 25,
      page: 2,
      pageSize: 20,
      totalPages: 2,
      isOutOfRange: false,
    });
  });

  it("listContactSubmissions xử lý an toàn khi page vượt quá tổng số trang", async () => {
    const lastPageItem = {
      id: VALID_UUID,
      name: "Trần Thị Bình",
      phone: "0988777666",
      email: "binh@example.com",
      service: "cung-ung-bep-an",
      status: "contacted" as const,
      emailStatus: "sent" as const,
      createdAt: new Date("2026-11-10T08:00:00Z"),
    };

    const countWhere = vi.fn().mockResolvedValue([{ total: 25 }]);
    const countFrom = vi.fn().mockReturnValue({ where: countWhere });

    const emptyOffset = vi.fn().mockResolvedValue([]);
    const fallbackOffset = vi.fn().mockResolvedValue([lastPageItem]);

    const makeListChain = (offsetFn: ReturnType<typeof vi.fn>) => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ offset: offsetFn }),
          }),
        }),
      }),
    });

    mocks.select
      .mockReturnValueOnce({ from: countFrom })
      .mockReturnValueOnce(makeListChain(emptyOffset))
      .mockReturnValueOnce(makeListChain(fallbackOffset));

    const result = await listContactSubmissions({ page: 99 });

    expect(emptyOffset).toHaveBeenCalledWith((99 - 1) * 20);
    expect(fallbackOffset).toHaveBeenCalledWith(20);
    expect(result.isOutOfRange).toBe(true);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.items).toEqual([lastPageItem]);
  });

  it("listDistinctContactServices kết hợp danh sách từ form công khai và giá trị tồn tại trong DB", async () => {
    const orderBy = vi
      .fn()
      .mockResolvedValue([{ service: "hop-rau-tuan" }, { service: "dich-vu-cu" }]);
    const from = vi.fn().mockReturnValue({ orderBy });
    mocks.selectDistinct.mockReturnValue({ from });

    const services = await listDistinctContactServices();

    expect(services.map((item) => item.value)).toEqual([
      "hop-rau-tuan",
      "cung-ung-bep-an",
      "chuyen-giao-ky-thuat",
      "tham-quan-nong-trai",
      "khac",
      "dich-vu-cu",
    ]);
    expect(services[0]?.label).toBe("Mua nông sản / Hộp rau gia đình");
  });

  it("getContactSubmissionById trả null ngay khi UUID không hợp lệ và không truy vấn DB", async () => {
    const result = await getContactSubmissionById("invalid-uuid-123");

    expect(result).toBeNull();
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("getContactSubmissionById trả chi tiết đầy đủ khi tồn tại và null khi không tìm thấy", async () => {
    const detail = {
      id: VALID_UUID,
      name: "Nguyễn Văn An",
      phone: "0912345678",
      email: "an@example.com",
      service: "hop-rau-tuan",
      message: "Dòng 1\nDòng 2",
      status: "new" as const,
      emailStatus: "failed" as const,
      createdAt: new Date("2026-11-10T08:00:00Z"),
      updatedAt: new Date("2026-11-10T08:00:00Z"),
    };

    const limitFound = vi.fn().mockResolvedValue([detail]);
    const whereFound = vi.fn().mockReturnValue({ limit: limitFound });
    const fromFound = vi.fn().mockReturnValue({ where: whereFound });
    mocks.select.mockReturnValueOnce({ from: fromFound });

    expect(await getContactSubmissionById(VALID_UUID)).toEqual(detail);

    const limitMissing = vi.fn().mockResolvedValue([]);
    const whereMissing = vi.fn().mockReturnValue({ limit: limitMissing });
    const fromMissing = vi.fn().mockReturnValue({ where: whereMissing });
    mocks.select.mockReturnValueOnce({ from: fromMissing });

    expect(await getContactSubmissionById(VALID_UUID)).toBeNull();
  });

  it("updateContactSubmissionStatus cập nhật status + updatedAt và không sửa emailStatus", async () => {
    expect(
      await updateContactSubmissionStatus({ id: "bad-id", status: "resolved" })
    ).toEqual({ ok: false, reason: "validation" });
    expect(
      await updateContactSubmissionStatus({ id: VALID_UUID, status: "invalid" })
    ).toEqual({ ok: false, reason: "validation" });
    expect(mocks.update).not.toHaveBeenCalled();

    const updatedAt = new Date("2026-11-13T09:00:00Z");
    const returning = vi
      .fn()
      .mockResolvedValue([{ id: VALID_UUID, status: "resolved", updatedAt }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.update.mockReturnValueOnce({ set });

    const successResult = await updateContactSubmissionStatus({
      id: VALID_UUID,
      status: "resolved",
    });

    expect(mocks.update).toHaveBeenCalledWith(contactSubmissions);
    const setArg = set.mock.calls[0][0] as Record<string, unknown>;
    expect(setArg.status).toBe("resolved");
    expect(setArg.updatedAt).toBeInstanceOf(Date);
    expect("emailStatus" in setArg).toBe(false);
    expect(successResult).toEqual({
      ok: true,
      data: { id: VALID_UUID, status: "resolved", updatedAt },
    });

    const emptyReturning = vi.fn().mockResolvedValue([]);
    mocks.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: emptyReturning }),
      }),
    });

    expect(
      await updateContactSubmissionStatus({ id: VALID_UUID, status: "spam" })
    ).toEqual({ ok: false, reason: "not_found" });
  });
});

