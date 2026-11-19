/* ============================================================
   OLIMP GYM — усі дані сайту в одному місці.
   Змінюєте ціни / графік / тренерів — тільки тут.
   ============================================================ */
window.OLIMP_DATA = {
  /* Графік: порядок Пн → Нд */
  schedule: [
    { day: 'Пн', full: 'Понеділок', open: '07:00', close: '22:00' },
    { day: 'Вт', full: 'Вівторок',  open: '07:00', close: '22:00' },
    { day: 'Ср', full: 'Середа',    open: '07:00', close: '22:00' },
    { day: 'Чт', full: 'Четвер',    open: '07:00', close: '22:00' },
    { day: 'Пт', full: "П'ятниця",  open: '07:00', close: '22:00' },
    { day: 'Сб', full: 'Субота',    open: '08:00', close: '20:00' },
    { day: 'Нд', full: 'Неділя',    open: '09:00', close: '18:00' }
  ],

  /* Ціна 1 місяця повного абонемента — база для розрахунку економії */
  baseMonthly: 1300,

  plans: {
    full: {
      label: 'Повний',
      hours: '07:00 – 22:00',
      items: [
        { months: 1,  price: 1300 },
        { months: 3,  price: 3650 },
        { months: 6,  price: 5850 },
        { months: 12, price: 9950 }
      ]
    },
    morning: {
      label: 'Ранковий',
      hours: '07:00 – 16:00',
      items: [
        { months: 1, price: 1100 }
      ]
    }
  },

  extras: [
    { id: 'single', name: 'Разове відвідування', price: 250 },
    { id: 'locker', name: 'Оренда шафи',         price: 250 }
  ],

  /* Тренери. photo: шлях до фото або null (тоді показується заглушка).
     TODO: додати фото з Instagram у assets/trainers/ і заповнити дані. */
  trainers: [
    {
      id: 'lazebnyk',
      name: 'Любов Лазебник',
      photo: null, // 'assets/trainers/lazebnyk.webp'
      experience: '3 роки досвіду',
      tags: ['Силовий тренінг', 'Функціональний тренінг', 'TRX', 'Кросфіт', 'Стретчинг', 'Корекція фігури', 'Нутриціологія'],
      instagram: 'trainer_lzb'
    },
    {
      id: 'vyhovskyi',
      name: 'Олександр Виговський',
      photo: null, // TODO: фото
      experience: null, // TODO: уточнити досвід
      tags: [],         // TODO: уточнити напрямки
      instagram: null
    },
    {
      id: 'konotop',
      name: 'Валентин Конотоп',
      photo: null, // TODO: фото
      experience: null, // TODO: уточнити досвід
      tags: [],         // TODO: уточнити напрямки
      instagram: null
    }
  ]
};
