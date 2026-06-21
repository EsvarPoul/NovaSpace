export const bookingServices = [
  {
    slug: "vr-30",
    name: "VR 30 хв",
    area: "vr",
    duration_minutes: 30,
    min_people: 1,
    max_people: 6,
    price_day: "200 грн",
    price_evening: "250 грн",
    price_note: "за одну VR-зону"
  },
  {
    slug: "vr-60",
    name: "VR 60 хв",
    area: "vr",
    duration_minutes: 60,
    min_people: 1,
    max_people: 6,
    price_day: "300 грн",
    price_evening: "350 грн",
    price_note: "за одну VR-зону"
  },
  {
    slug: "vr-90",
    name: "VR 90 хв",
    area: "vr",
    duration_minutes: 90,
    min_people: 1,
    max_people: 6,
    price_day: "400 грн",
    price_evening: "500 грн",
    price_note: "за одну VR-зону"
  },
  {
    slug: "ps5-60-1",
    name: "PS5 60 хв · 1 людина",
    area: "vr",
    duration_minutes: 60,
    min_people: 1,
    max_people: 1,
    price_day: "150 грн",
    price_evening: "200 грн",
    price_note: "PS5 зона на два джойстика"
  },
  {
    slug: "ps5-60-2",
    name: "PS5 60 хв · 2 людини",
    area: "vr",
    duration_minutes: 60,
    min_people: 2,
    max_people: 2,
    price_day: "200 грн",
    price_evening: "250 грн",
    price_note: "PS5 зона на два джойстика"
  },
  {
    slug: "ps5-120-1",
    name: "PS5 120 хв · 1 людина",
    area: "vr",
    duration_minutes: 120,
    min_people: 1,
    max_people: 1,
    price_day: "250 грн",
    price_evening: "300 грн",
    price_note: "PS5 зона на два джойстика"
  },
  {
    slug: "ps5-120-2",
    name: "PS5 120 хв · 2 людини",
    area: "vr",
    duration_minutes: 120,
    min_people: 2,
    max_people: 2,
    price_day: "350 грн",
    price_evening: "400 грн",
    price_note: "PS5 зона на два джойстика"
  },
  {
    slug: "novamix2-60",
    name: "NovaMix2 60 хв · VR + PS5",
    area: "vr",
    duration_minutes: 60,
    min_people: 2,
    max_people: 2,
    price_day: "700 грн",
    price_evening: "800 грн",
    price_note: "поєднання VR та PS5 на одну годину"
  },
  {
    slug: "birthday-3h",
    name: "День народження · 3 години",
    area: "event",
    duration_minutes: 180,
    min_people: 4,
    max_people: 10,
    price_day: "від 4500 грн",
    price_evening: "від 5200 грн",
    price_note: "4 люд: 4500/5200, 5 люд: 5400/6000, 6-10 люд: 6400/7000"
  },
  {
    slug: "studio-rent",
    name: "Оренда студії",
    area: "studio",
    duration_minutes: 60,
    min_people: 1,
    max_people: 5,
    price_day: "600 грн",
    price_evening: "600 грн",
    price_note: "ціна за 1 годину оренди студії"
  }
];

export const bookingServicePricing = Object.fromEntries(
  bookingServices.map((service) => [
    service.slug,
    {
      price_day: service.price_day,
      price_evening: service.price_evening,
      price_note: service.price_note
    }
  ])
);
