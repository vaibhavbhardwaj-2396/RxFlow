/* RxFlow service worker — Web Push only. Base-path portable: everything
   resolves against the registration scope, so this file needs no build step. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

const scope = self.registration.scope; // e.g. https://host/rxflow/
const iconUrl = new URL("icon.svg", scope).href;

self.addEventListener("push", (event) => {
  let data = {
    title: "RxFlow",
    body: "You have a reminder.",
    url: new URL("dashboard", scope).href,
  };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.url,
      icon: iconUrl,
      badge: iconUrl,
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url;
  const url = new URL(target || "dashboard", scope);
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.startsWith(self.location.origin)) {
            client.navigate(url.href);
            return client.focus();
          }
        }
        return self.clients.openWindow(url.href);
      }),
  );
});
