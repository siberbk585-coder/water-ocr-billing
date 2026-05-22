import { appTitle } from "@/lib/vi";

export const metadata = {
  title: `Xem hóa đơn — ${appTitle}`,
};

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
