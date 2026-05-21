"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Sai số điện thoại hoặc mật khẩu");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="phone">
          Số điện thoại
        </label>
        <input
          id="phone"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0900000001"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
