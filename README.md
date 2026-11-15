# ArendagaGift Reels

Arendaga Gift uchun Instagram Reels videolarini avtomatik yasaydigan loyiha.

## Hozirgi holat

Video yasash qismi ishlaydi; katalogdan o'qish, stil tanlash algoritmi va
Instagram'ga joylash hali qo'shilmagan.

## Tuzilishi

| Yo'l | Vazifasi |
| --- | --- |
| `scripts/fetch_gift.py` | Gift slug'i bo'yicha animatsiya, ranglar va noyoblik ma'lumotini yuklaydi |
| `scripts/make_audio.py` | Musiqa va ovoz effektlarini sintez qiladi (litsenziyasiz, o'zimizniki) |
| `scripts/make_voice.py` | edge-tts bilan o'zbekcha ovoz yozadi |
| `src/kit.tsx` | Umumiy animatsiya qismlari: fon, gift, matn, tugma |
| `src/Showcase.tsx` | "Namoyish" stili: xira ko'rinish, keskin ochilish, noyoblik, chaqiriq |
| `src/Profile.tsx` | "Profil" stili (ovozli): oddiy profil gift tushgach o'zgaradi |
| `src/Top3.tsx` | "Top-3" stili: uchta giftning tez sanog'i |
| `src/Luxe.tsx` | "Narx" stili: qora-oltin, siluet, kunlik narx sanab chiqadi |
| `src/Chat.tsx` | "Chat" stili: yozishma orqali hikoya, gift xabar bo'lib keladi |
| `src/Steps.tsx` | "Qadamlar" stili: och fon, uch qadam, oxirida gift rangi ekranni egallaydi |
| `src/Root.tsx` | Kompozitsiyalar ro'yxati va muqova |

## Ishga tushirish

Talab: Node.js 22, Python 3.12+, ffmpeg, Chromium.

~~~bash
npm ci
pip install edge-tts numpy
python3 scripts/fetch_gift.py MoonPendant-95850
python3 scripts/make_audio.py
npm run bundle
npx remotion render build Showcase out/showcase.mp4 --props='{"id":"moonpendant-95850","hook":["Bu giftni","*sotib* *olish*","shart emas"]}'
~~~

Tizimdagi Chromium'dan foydalanish uchun `CHROME_PATH` muhit o'zgaruvchisini
uning yo'liga o'rnating.

Maxfiy qiymatlar (`MARKETING_FEED_TOKEN`, Instagram tokeni) faqat GitHub
Actions secrets'da turadi, repoga yozilmaydi.
