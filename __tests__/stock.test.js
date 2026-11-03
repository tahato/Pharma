import {
  daysUntil,
  formatDA,
  formatExpiry,
  isExpiringSoon,
  localDateString,
  stockStatus,
} from "@/tools/stock";

describe("stockStatus", () => {
  test("out when nothing is sellable", () => {
    expect(stockStatus({ qty: 0, min_stock: 5 })).toBe("out");
  });
  test("low at or under the minimum", () => {
    expect(stockStatus({ qty: 5, min_stock: 5 })).toBe("low");
    expect(stockStatus({ qty: 1, min_stock: 5 })).toBe("low");
  });
  test("ok above the minimum", () => {
    expect(stockStatus({ qty: 6, min_stock: 5 })).toBe("ok");
  });
});

describe("formatDA", () => {
  test("groups thousands with a space and rounds", () => {
    expect(formatDA(2720)).toBe("2 720 DA");
    expect(formatDA("1234567.4")).toBe("1 234 567 DA");
    expect(formatDA(0)).toBe("0 DA");
  });
});

describe("dates", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 31, 10, 0, 0)); // 31 Oct 2026, local
  });
  afterEach(() => jest.useRealTimers());

  test("localDateString uses the local calendar day", () => {
    expect(localDateString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
  test("formatExpiry shows MM/YYYY without shifting the month", () => {
    expect(formatExpiry("2027-03-31")).toBe("03/2027");
    expect(formatExpiry("2027-01-01")).toBe("01/2027");
  });
  test("daysUntil counts calendar days from now", () => {
    expect(daysUntil("2026-11-30")).toBe(30);
    expect(daysUntil("2026-10-30")).toBe(-1);
  });
  test("isExpiringSoon covers soon and already expired, not far dates", () => {
    expect(isExpiringSoon({ earliest_expiry: "2026-11-20" }, 30)).toBe(true);
    expect(isExpiringSoon({ earliest_expiry: "2026-10-01" }, 30)).toBe(true);
    expect(isExpiringSoon({ earliest_expiry: "2027-06-30" }, 30)).toBe(false);
    expect(isExpiringSoon({ earliest_expiry: null }, 30)).toBe(false);
  });
  test("the alert window is respected", () => {
    expect(isExpiringSoon({ earliest_expiry: "2027-01-15" }, 30)).toBe(false);
    expect(isExpiringSoon({ earliest_expiry: "2027-01-15" }, 90)).toBe(true);
  });
});
