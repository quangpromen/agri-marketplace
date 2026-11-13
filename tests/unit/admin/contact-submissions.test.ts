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
    expect(buildContactSubmissionWhereClause({ q: "   " })).toBeUndefined();

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

  it("listContactSubmissions đếm trước rồi mới chạy đúng 1 query danh sách, áp dụng bộ lọc và không lấy message", async () => {
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

    const callOrder: string[] = [];

    const countWhere = vi.fn().mockImplementation(async () => {
      callOrder.push("count");
      expect(mocks.select).toHaveBeenCalledTimes(1);
      return [{ total: 25 }];
    });
    const countFrom = vi.fn().mockReturnValue({ where: countWhere });

    const listOffset = vi.fn().mockImplementation(async () => {
      callOrder.push("list");
      return [sampleItem];
    });
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
      emailStatus: "failed",
      service: "hop-rau-tuan",
      page: 2,
    });

    expect(callOrder).toEqual(["count", "list"]);
    expect(mocks.select).toHaveBeenCalledTimes(2);

    const countWhereArg = countWhere.mock.calls[0]?.[0];
    const listWhereArg = listWhere.mock.calls[0]?.[0];
    expect(countWhereArg).toBeDefined();
    expect(listWhereArg).toBe(countWhereArg);

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

  it("listContactSubmissions khi page vượt phạm vi chỉ truy vấn 1 lần với offset trang cuối hợp lệ và giữ nguyên bộ lọc", async () => {
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

    const callOrder: string[] = [];

    const countWhere = vi.fn().mockImplementation(async () => {
      callOrder.push("count");
      expect(mocks.select).toHaveBeenCalledTimes(1);
      return [{ total: 25 }];
    });
    const countFrom = vi.fn().mockReturnValue({ where: countWhere });

    const listOffset = vi.fn().mockImplementation(async () => {
      callOrder.push("list");
      return [lastPageItem];
    });
    const listLimit = vi.fn().mockReturnValue({ offset: listOffset });
    const listOrderBy = vi.fn().mockReturnValue({ limit: listLimit });
    const listWhere = vi.fn().mockReturnValue({ orderBy: listOrderBy });
    const listFrom = vi.fn().mockReturnValue({ where: listWhere });

    mocks.select
      .mockReturnValueOnce({ from: countFrom })
      .mockReturnValueOnce({ from: listFrom });

    const result = await listContactSubmissions({
      q: "binh",
      status: "contacted",
      page: 100_000,
    });

    expect(callOrder).toEqual(["count", "list"]);
    expect(mocks.select).toHaveBeenCalledTimes(2);
    expect(listLimit).toHaveBeenCalledTimes(1);
    expect(listLimit).toHaveBeenCalledWith(20);
    expect(listOffset).toHaveBeenCalledTimes(1);
    expect(listOffset).toHaveBeenCalledWith(20);
    expect(listOffset).not.toHaveBeenCalledWith((100_000 - 1) * 20);

    const countWhereArg = countWhere.mock.calls[0]?.[0];
    const listWhereArg = listWhere.mock.calls[0]?.[0];
    expect(countWhereArg).toBeDefined();
    expect(listWhereArg).toBe(countWhereArg);

    expect(result).toEqual({
      items: [lastPageItem],
      totalCount: 25,
      page: 2,
      pageSize: 20,
      totalPages: 2,
      isOutOfRange: true,
    });
  });

  it("listContactSubmissions không chạy query danh sách khi tổng số bản ghi bằng 0", async () => {
    const countWherePage1 = vi.fn().mockResolvedValue([{ total: 0 }]);
    mocks.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: countWherePage1 }),
    });

    const emptyResultPage1 = await listContactSubmissions({ q: "khong-ton-tai", page: 1 });
    expect(mocks.select).toHaveBeenCalledTimes(1);
    expect(countWherePage1.mock.calls[0]?.[0]).toBeDefined();
    expect(emptyResultPage1).toEqual({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      isOutOfRange: false,
    });

    mocks.select.mockReset();

    const countWhereOutOfRange = vi.fn().mockResolvedValue([{ total: 0 }]);
    mocks.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: countWhereOutOfRange }),
    });

    const emptyResultPage5 = await listContactSubmissions({ page: 5 });
    expect(mocks.select).toHaveBeenCalledTimes(1);
    expect(emptyResultPage5).toEqual({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      isOutOfRange: true,
    });
  });

  it("listDistinctContactServices kết hợp danh sách từ form công khai và giá trị tồn tại trong DB", async () => {
    const orderBy = vi
      .fn()
      .mockResolvedValue([
        { service: "hop-rau-tuan" },
        { service: "   " },
        { service: "dich-vu-cu" },
      ]);
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

