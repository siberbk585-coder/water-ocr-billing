/** Đọc JSON từ fetch — tránh lỗi khi server trả body rỗng. */
export async function readJsonResponse<T extends Record<string, unknown>>(
  res: Response
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      error: res.ok
        ? "Máy chủ không trả dữ liệu (có thể quá thời gian — thử lại hoặc tạo ít hộ trước)."
        : `HTTP ${res.status}`,
    } as unknown as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: text.slice(0, 300) } as unknown as T;
  }
}
