# THE WORLD TODAY — Tuesday 24 November 2026

[![THE WORLD TODAY](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/c/news-image-20261124)
[![Rank](https://make.fun/badge/news-image-20261124/adzinsyariif/news-image-20261124/rank.svg)](https://make.fun/c/news-image-20261124)
[![Reward](https://make.fun/badge/news-image-20261124/adzinsyariif/news-image-20261124/reward.svg)](https://make.fun/c/news-image-20261124)

A program that draws one 1024×1024 front page summing up the world's news of
Tuesday 24 November 2026 — entirely from code. No image assets, no network, no
randomness: `main.ts` builds a hand-drawn 5×7 pixel font, a framebuffer and a
small PNG encoder on the Node standard library alone, and two runs write
byte-identical output.

## The page

- **Masthead** — THE WORLD TODAY, TUESDAY 24 NOVEMBER 2026.
- **Markets strip** — the day's moves: Nasdaq +6.5%, S&P 500 +4.7%, Nvidia
  +31%, Sensex −1.8%, oil down.
- **Lead story** — Nvidia reinstates Jensen Huang as chief executive, 12 days
  after he resigned; shares close 31% higher and lift Wall Street. With a
  surge chart of the three jumps.
- **Six regional panels, 30 stories** — Europe, Middle East & Africa,
  Asia-Pacific, Americas, Tech & Markets, Sport & Culture.
- **Footer** — every story first reported on 24 November 2026.

## Stories on the page (31)

**Lead:** Nvidia reinstates Jensen Huang; shares +31%, Nasdaq +6.5%, S&P 500
+4.7%.

**Europe:** Russian drone briefly enters Polish airspace; NATO sends an AWACS
radar plane to Poland; COP31 climate talks collapse with no deal; Germany
adopts Ukraine's Delta battlefield system; Murmansk governor detained for
graft.

**Middle East & Africa:** three killed in Gaza, a UN worker among them; Iran
flogs a singer and four of her team, 74 lashes each; Iran vows to confront a
US naval blockade; the US sanctions dozens linked to Iran; Ukraine sinks a
Russian warship off Libya.

**Asia-Pacific:** 24 dead, 30 missing in an Indonesia factory fire; Ulleung
island warned as a Russian jet enters South Korean airspace; Modi opens an AI
centre at IIT Patna; India and China hold military talks; Lahore's AQI passes
500 as it tops the world pollution list.

**Americas:** Trump orders the Army to pause a detonation in Iowa; Chicago's
O'Hare halts flights for Thanksgiving; Mexico captures cartel suspect Chapo
Isidro; agents raid child care centres in a $41M Minnesota fraud case;
ex-mayor of Jackson gets 37 months for bribery.

**Tech & Markets:** Nasdaq jumps 6.5%, S&P 500 gains 4.7%; newly listed
Anthropic slides 1.4%; House panels say security fears remain; India's
Sensex falls 1,484 points to 82,435; oil falls as Middle East supply grows.

**Sport & Culture:** Alcaraz beats Zverev 6-2, 7-6 for the ATP Finals title;
Verstappen takes the Las Vegas Grand Prix; Gukesh meets Sindarov in Game 1
of the World Chess Championship in Geneva; India and New Zealand draw the
first Test; Mossad stopped an ISIS plot on Taylor Swift's Vienna gigs.

Sources: Reuters, AP, CNN, The Hindu, The Times of India. Every story was
first reported on Tuesday 24 November 2026 (Monday evening UTC is Tuesday in
Asia-Pacific time).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node 22, standard library only. Writes `out/entry.png` (1024×1024 PNG,
under 1 MiB). Run it twice and compare: the bytes are identical.

## License

MIT — see [LICENSE](LICENSE).
