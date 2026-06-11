import { bookingServices } from "./bookingServices.js";
import { studioServices } from "./studio.js";

export const siteUrl = "https://nova-space.pp.ua";
export const phone = "+380660097630";
export const bookingUrl = `${siteUrl}/booking/`;
export const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=%D0%BC.+%D0%91%D1%80%D0%BE%D0%B2%D0%B0%D1%80%D0%B8,+%D0%B2%D1%83%D0%BB.+%D0%AF%D1%80%D0%BE%D1%81%D0%BB%D0%B0%D0%B2%D0%B0+%D0%9C%D1%83%D0%B4%D1%80%D0%BE%D0%B3%D0%BE,+28";

export const address = {
  "@type": "PostalAddress",
  streetAddress: "вул. Ярослава Мудрого, 28",
  addressLocality: "Бровари",
  addressRegion: "Київська область",
  addressCountry: "UA"
};

const week = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const actionPlatforms = [
  "http://schema.org/DesktopWebPlatform",
  "http://schema.org/MobileWebPlatform"
];

const makeContactPoint = (areaServed = "UA") => ({
  "@type": "ContactPoint",
  telephone: phone,
  contactType: "customer service",
  areaServed,
  availableLanguage: ["uk", "ru"]
});

const makeReserveAction = (name) => ({
  "@type": "ReserveAction",
  name,
  target: {
    "@type": "EntryPoint",
    urlTemplate: bookingUrl,
    inLanguage: "uk-UA",
    actionPlatform: actionPlatforms
  }
});

const extractPrice = (value) => {
  const match = String(value).match(/\d+/);
  return match ? match[0] : undefined;
};

const cityServed = {
  "@type": "City",
  name: "Бровари"
};

const makeBookingOffer = (service, providerId) => ({
  "@type": "Offer",
  "@id": `${bookingUrl}#offer-${service.slug}`,
  name: service.name,
  url: bookingUrl,
  price: extractPrice(service.price_day),
  priceCurrency: "UAH",
  availability: "https://schema.org/InStock",
  description: `${service.price_day}${
    service.price_evening !== service.price_day ? `, вечір: ${service.price_evening}` : ""
  }. ${service.price_note}`,
  eligibleQuantity: {
    "@type": "QuantitativeValue",
    minValue: service.min_people,
    maxValue: service.max_people
  },
  itemOffered: {
    "@type": "Service",
    name: service.name,
    serviceType: service.area,
    provider: {
      "@id": providerId
    },
    areaServed: cityServed
  }
});

const makeTextOffer = ({ id, name, price, description, providerId, url = bookingUrl }) => ({
  "@type": "Offer",
  "@id": `${url}#offer-${id}`,
  name,
  url,
  price: extractPrice(price),
  priceCurrency: "UAH",
  availability: "https://schema.org/InStock",
  description,
  itemOffered: {
    "@type": "Service",
    name,
    provider: {
      "@id": providerId
    },
    areaServed: cityServed
  }
});

const makeOfferCatalog = (name, offers) => ({
  "@type": "OfferCatalog",
  name,
  itemListElement: offers
});

const vrProviderId = `${siteUrl}/vr/#localbusiness`;
const studioProviderId = `${siteUrl}/studio/#localbusiness`;
const vrOffers = bookingServices
  .filter((service) => service.area === "vr" || service.area === "event")
  .map((service) => makeBookingOffer(service, vrProviderId));

const studioOffers = [
  ...bookingServices
    .filter((service) => service.area === "studio")
    .map((service) => makeBookingOffer(service, studioProviderId)),
  ...studioServices.map((service) =>
    makeTextOffer({
      id: service.title.toLowerCase().replaceAll(" ", "-"),
      name: service.title,
      price: service.price,
      description: `${service.type}: ${service.text}`,
      providerId: studioProviderId,
      url: `${siteUrl}/studio/`
    })
  )
];

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "Nova Space",
  url: siteUrl,
  logo: `${siteUrl}/vr/nova-space-logo.webp`,
  telephone: phone,
  address,
  contactPoint: [makeContactPoint("UA")],
  sameAs: [
    "https://instagram.com/novaspace_vr",
    "https://www.instagram.com/nova_photostudio_/"
  ]
};

export const novaVrSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/vr/#localbusiness`,
  name: "NOVA VR | VR клуб Бровари",
  description:
    "VR клуб у Броварах для ігор, днів народження, корпоративів, побачень і компаній до 6 гравців.",
  url: `${siteUrl}/vr/`,
  image: `${siteUrl}/vr/nova-space-logo.webp`,
  telephone: phone,
  priceRange: "200-7000 UAH",
  address,
  hasMap: mapsUrl,
  contactPoint: [makeContactPoint("UA")],
  parentOrganization: {
    "@id": `${siteUrl}/#organization`
  },
  potentialAction: makeReserveAction("Забронювати NOVA VR"),
  hasOfferCatalog: makeOfferCatalog("Послуги NOVA VR у Броварах", vrOffers),
  sameAs: ["https://instagram.com/novaspace_vr"],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: week,
      opens: "10:00",
      closes: "22:00"
    }
  ],
  areaServed: [
    {
      "@type": "City",
      name: "Бровари"
    },
    {
      "@type": "AdministrativeArea",
      name: "Київська область"
    }
  ]
};

export const novaPhotoStudioSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/studio/#localbusiness`,
  name: "Nova PhotoStudio | Фотостудія Бровари",
  description:
    "Світла фотостудія у Броварах для портретів, сімейних зйомок, beauty-контенту та фото для брендів.",
  url: `${siteUrl}/studio/`,
  image: `${siteUrl}/studio/studio-hero.png`,
  telephone: phone,
  priceRange: "600 UAH/hour",
  address,
  hasMap: mapsUrl,
  contactPoint: [makeContactPoint("UA")],
  parentOrganization: {
    "@id": `${siteUrl}/#organization`
  },
  potentialAction: makeReserveAction("Забронювати Nova PhotoStudio"),
  hasOfferCatalog: makeOfferCatalog("Послуги Nova PhotoStudio у Броварах", studioOffers),
  sameAs: ["https://www.instagram.com/nova_photostudio_/"],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: week,
      opens: "10:00",
      closes: "21:00"
    }
  ]
};
