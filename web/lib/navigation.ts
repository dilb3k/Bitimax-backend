/** Login destinations must remain on this origin, including after browser URL normalization. */
export function safeNextPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return "/kabinet";
  try {
    const url = new URL(value, "https://bitmax.invalid");
    if (url.origin !== "https://bitmax.invalid" || url.pathname === "/kirish")
      return "/kabinet";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/kabinet";
  }
}
