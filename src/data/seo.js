export const siteUrl = "https://nova-space.pp.ua";
export const phone = "+380660097630";
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

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "Nova Space",
  url: siteUrl,
  logo: `${siteUrl}/vr/nova-space-logo.webp`,
  telephone: phone,
  address,
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
  parentOrganization: {
    "@id": `${siteUrl}/#organization`
  },
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
  parentOrganization: {
    "@id": `${siteUrl}/#organization`
  },
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
