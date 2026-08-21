"use client";

import { StoreProvider } from "@/lib/store";
import { I18nProvider } from "@/lib/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <StoreProvider>{children}</StoreProvider>
    </I18nProvider>
  );
}
