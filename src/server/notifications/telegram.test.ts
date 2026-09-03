import { describe, expect, it } from "vitest";

import { telegramStartToken } from "./telegram-parse";

describe("telegramStartToken", () => {
  it("pulls the token from a /start deep-link", () => {
    expect(
      telegramStartToken({
        message: { chat: { id: 42 }, text: "/start abc123" },
      }),
    ).toEqual({ token: "abc123", chatId: 42 });
  });

  it("ignores a bare /start", () => {
    expect(
      telegramStartToken({ message: { chat: { id: 42 }, text: "/start" } }),
    ).toBeNull();
  });

  it("ignores a plain message", () => {
    expect(
      telegramStartToken({ message: { chat: { id: 42 }, text: "hello" } }),
    ).toBeNull();
  });

  it("ignores an update with no chat id", () => {
    expect(
      telegramStartToken({ message: { text: "/start abc123" } }),
    ).toBeNull();
  });

  it("ignores an empty update", () => {
    expect(telegramStartToken({})).toBeNull();
  });
});
