import { signal } from "@lit-labs/signals";
import { LOCALE_STATUS_EVENT } from "@lit/localize";

export const activeLocale = signal<string | null>(null);

window.addEventListener(LOCALE_STATUS_EVENT, (event) => {
  if (event.detail.status === "ready") {
    activeLocale.set(event.detail.readyLocale);
  }
});
