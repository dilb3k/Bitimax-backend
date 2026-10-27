import test from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "./navigation";
test("login preserves internal purchase, listing and query destinations", () => {
  for (const path of [
    "/kabinet/yangi",
    "/kabinet/bitim",
    "/sotib-olish/abc",
    "/kod?code=ABCD1234",
  ])
    assert.equal(safeNextPath(path), path);
});
test("login refuses external, backslash-normalized, control-character and login-loop destinations", () => {
  for (const path of [
    null,
    "",
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/\n/evil.test",
    "/kirish?next=/kirish",
  ])
    assert.equal(safeNextPath(path), "/kabinet");
});
