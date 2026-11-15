# ArendagaGift Reels

Arendaga Gift uchun Instagram Reels avtopiloti: katalogdan gift tanlaydi,
video va muqova yasaydi, Instagram'ga joylaydi va natijalardan o'rganadi.

## Qanday ishlaydi

~~~text
GitHub Actions (kuniga 2-4 marta)
  1. statistika   oldingi videolarning ko'rsatkichlarini yangilaydi
  2. reja         katalogni o'qiydi; stil, hook va giftni tanlaydi
  3. render       gift animatsiyasi + ovoz + musiqa -> video va muqova
  4. joylash      Instagram rasmiy API orqali Reels
  5. yozuv        state/posts.json ga natijani yozadi
~~~

Instagram ma'lumotlari sozlanmagan bo'lsa 4-qadam "quruq rejim"da o'tadi:
hech narsa joylanmaydi, video Actions sahifasida artifact sifatida turadi.

## Stillar

| Stil | Fayl | Ko'rinishi |
| --- | --- | --- |
| `showcase` | `src/Showcase.tsx` | Xira ko'rinish, keskin ochilish, noyoblik foizlari |
| `profile` | `src/Profile.tsx` | Ovozli; oddiy profil gift tushgach o'zgaradi |
| `top3` | `src/Top3.tsx` | Eng noyob yoki eng arzon uchlik, tez sanoq |
| `luxe` | `src/Luxe.tsx` | Qora-oltin; "kuniga qancha?" va narx sanab chiqadi |
| `chat` | `src/Chat.tsx` | Yozishma orqali hikoya |
| `steps` | `src/Steps.tsx` | Och fon, uch qadam |

Yangi stil qo'shish: `src/` da kompozitsiya yozing, `src/Root.tsx` ga
ro'yxatdan o'tkazing va `pipeline/styles.py` dagi `STYLES` ga qo'shing.

## Tanlash algoritmi

`pipeline/bandit.py` Thompson sampling qo'llaydi. Har bir videoning bahosi
ko'rishlar, o'rtacha tomosha vaqti, dastlabki 3 soniyada o'tkazib yuborish
ulushi, ulashish, saqlash va izohlardan hisoblanadi. Yaxshi natija bergan stil
va hook ko'proq tanlanadi, lekin yangilari ham sinab turiladi. Qoidalar:

- ketma-ket ikki video bir xil stilda bo'lmaydi;
- ijarada turgan gift reklama qilinmaydi;
- bir gift oxirgi 6 ta videoda qatnashgan bo'lsa, navbat boshqasiga beriladi.

## Sozlash (GitHub: Settings -> Secrets and variables -> Actions)

| Nomi | Turi | Qiymati |
| --- | --- | --- |
| `MARKETING_FEED_TOKEN` | secret | Serverdagi katalog endpointi kaliti |
| `IG_ACCESS_TOKEN` | secret | Instagram uzoq muddatli tokeni |
| `IG_USER_ID` | variable | Instagram professional akkaunt ID raqami |
| `IG_LOGIN` | variable | `instagram` (standart) yoki `facebook` |
| `MEDIA_REPO` | variable | Videolar turadigan ochiq repo, masalan `DurbekFZ/ArendagaGiftVideo` |
| `MEDIA_BASE_URL` | variable | O'sha reponing GitHub Pages manzili |
| `MEDIA_REPO_TOKEN` | secret | `MEDIA_REPO` ga yozish huquqli fine-grained token |
| `POSTS_PER_DAY` | variable | `2`, `3` yoki `4` (standart `4`) |

`IG_LOGIN=instagram` bo'lsa Instagram videoni ochiq manzildan yuklab oladi,
shuning uchun `MEDIA_*` qiymatlari kerak. `IG_LOGIN=facebook` bo'lsa fayl
to'g'ridan-to'g'ri yuklanadi va `MEDIA_*` shart emas (muqova o'rniga videodagi
eng yaxshi kadr olinadi).

## Mahalliy ishga tushirish

Talab: Node.js 22, Python 3.12+, ffmpeg.

~~~bash
npm ci
pip install -r requirements.txt pytest
python -m pytest -q tests
MARKETING_FEED_FILE=tests/sample_feed.json python -m pipeline.run plan
python -m pipeline.run render
~~~

Tizimdagi Chromium'dan foydalanish uchun `CHROME_PATH` ni uning yo'liga
o'rnating; aks holda `npx remotion browser ensure` o'zi yuklab oladi.

Maxfiy qiymatlar faqat GitHub Actions secrets'da turadi, repoga yozilmaydi.
