"""The style library: what each video kind needs and how it is filled in.

A style's `build` receives the chosen gifts (feed item merged with public
gift details), the hook name and a random source, and returns the Remotion
composition, its props, the cover and the hero moment used as a thumbnail
fallback. `*word*` marks an accent word in on-screen headlines.
"""
from .feed import month_discount


def money(value: int) -> str:
    return f"{value:,}".replace(",", " ")


def showcase(gifts, hook, rng):
    gift = gifts[0]
    hooks = {
        "no_buy": (["Bu giftni", "*sotib* *olish*", "shart emas"], ["Sotib olish", "*shart* *emas*"]),
        "not_everyone": (["Bunday gift", "*hammada*", "yo‘q"], ["Hammada", "*yo‘q* gift"]),
        "your_profile": (["Profilingga", "*shu* *gift*", "yarashadi"], ["Profilingga", "*yarashadi*"]),
    }
    lines, cover = hooks[hook]
    return {"composition": "Showcase", "props": {"id": gift["id"], "hook": lines},
            "cover": {"id": gift["id"], "headline": cover}, "hero_ms": 3000}


def profile(gifts, hook, rng):
    gift = gifts[0]
    scripts = {
        "want": ["Telegram profilingizda shunday noyob gift turishini xohlaysizmi?",
                 "Uni sotib olish shart emas.",
                 "Arendaga Gift botida uch kundan o‘ttiz kungacha ijaraga oling.",
                 "Havola profilda."],
        "friends": ["Do‘stlaringiz profilingizga kirganda nimani ko‘radi?",
                    "Noyob gift uchun katta pul shart emas.",
                    "Arendaga Gift botida xohlagan giftingizni ijaraga oling.",
                    "Havola profilda."],
    }
    return {"composition": "Profile", "props": {"id": gift["id"]}, "voice": {
                "name": "profile", "voice": rng.choice(["uz-UZ-MadinaNeural", "uz-UZ-SardorNeural"]),
                "lines": scripts[hook]},
            "cover": {"id": gift["id"], "headline": ["Profilingda", "*shu* *tursa?*"]}, "hero_ms": 2500}


def top3(gifts, hook, rng):
    # `gifts` arrive ordered third place, second place, first place.
    ids = [gift["id"] for gift in gifts]
    if hook == "cheapest":
        return {"composition": "Top3", "props": {"ids": ids, "headline": ["Eng arzon", "*3* *ta* gift"],
                                                 "prices": [gift["dailyPrice"] for gift in gifts]},
                "cover": {"id": ids[2], "headline": ["Eng arzon", "*3* *ta* gift"], "badge": "TOP 3"}, "hero_ms": 8600}
    return {"composition": "Top3", "props": {"ids": ids, "headline": ["Eng noyob", "*3* *ta* gift"]},
            "cover": {"id": ids[2], "headline": ["Eng noyob", "*3* *ta* gift"], "badge": "TOP 3"}, "hero_ms": 8600}


def luxe(gifts, hook, rng):
    gift = gifts[0]
    props = {"id": gift["id"], "price": gift["dailyPrice"]}
    if month_discount(gift) > 0:
        props["discount"] = month_discount(gift)
    return {"composition": "Luxe", "props": props,
            "cover": {"id": gift["id"], "headline": ["Kuniga", "*qancha?*"]}, "hero_ms": 4200}


def chat(gifts, hook, rng):
    gift = gifts[0]
    return {"composition": "Chat", "props": {"id": gift["id"], "price": gift["dailyPrice"]},
            "cover": {"id": gift["id"], "headline": ["Bu gift", "*qayerdan?*"]}, "hero_ms": 6500}


def steps(gifts, hook, rng):
    gift = gifts[0]
    variants = {
        "open": ["Botni oching", "Giftni tanlang", "Profilingizda!"],
        "pay": ["Giftni tanlang", "Muddatni belgilang", "Profilingizda!"],
    }
    return {"composition": "Steps", "props": {"id": gift["id"], "steps": variants[hook]},
            "cover": {"id": gift["id"], "headline": ["3 qadamda", "*ijaraga* ol"]}, "hero_ms": 4600}


# count: gifts needed. rank: how gifts are picked for multi-gift styles.
STYLES = {
    "showcase": {"build": showcase, "count": 1, "hooks": ["no_buy", "not_everyone", "your_profile"]},
    "profile": {"build": profile, "count": 1, "hooks": ["want", "friends"]},
    "top3": {"build": top3, "count": 3, "hooks": ["rarest", "cheapest"]},
    "luxe": {"build": luxe, "count": 1, "hooks": ["ask"]},
    "chat": {"build": chat, "count": 1, "hooks": ["friend"]},
    "steps": {"build": steps, "count": 1, "hooks": ["open", "pay"]},
}

TAGS = "#telegram #nft #telegramgift #nftgift #uzbekistan #toshkent #arendagagift"
CAPTIONS = {
    "showcase": ["{title} #{number} — sotib olish shart emas, ijaraga oling. Kuniga {price} so‘mdan.",
                 "{title} profilingizda turishi mumkin. Ijara kuniga {price} so‘mdan."],
    "profile": ["Profilingizga noyob NFT gift — sotib olmasdan. 3 kundan 30 kungacha ijara.",
                "Telegram profilingizni {title} bilan bezang. Ijara kuniga {price} so‘mdan."],
    "top3": ["Katalogimizdagi uchlik. Qaysi biri sizga yoqdi? Izohda yozing.",
             "Uchala gift ham ijarada. Birinchi o‘rindagisini olarmidingiz?"],
    "luxe": ["{title} #{number} — kuniga atigi {price} so‘m. Taxminingiz to‘g‘ri chiqdimi?",
             "Qimmat ko‘rinadi, lekin ijarasi kuniga {price} so‘m."],
    "chat": ["Do‘stingizga yuboring — u ham bilsin. {title} ijarasi kuniga {price} so‘m.",
             "Hamma so‘raydi: gift qayerdan? Javob: ijaraga. Kuniga {price} so‘m."],
    "steps": ["NFT gift ijarasi 3 qadamda. Saqlab qo‘ying, keyin kerak bo‘ladi.",
              "Bot → gift → profil. {title} kuniga {price} so‘mdan."],
}


def caption(style: str, gifts: list[dict], rng) -> str:
    lead = gifts[-1]
    text = rng.choice(CAPTIONS[style]).format(
        title=lead["title"], number=lead["number"], price=money(lead["dailyPrice"]))
    return f"{text}\n\nHavola profilda. Telegram: @ArendagaGiftBot\n\n{TAGS}"
