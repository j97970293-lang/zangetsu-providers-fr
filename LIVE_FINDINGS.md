# Observations live

Les vérifications du 15 août 2026 ont confirmé que `https://french-stream.one/`, `https://w16.french-manga.net/` et `https://movix.fun/` répondent en HTTP 200 avec un user-agent navigateur. `https://api.movix.fun/` répond en HTTP 404 à la racine, ce qui confirme que les routes API doivent être appelées directement.

`https://w16.french-manga.net/engine/ajax/manga_episodes_api.php?id=1498810` renvoie un JSON de la forme `{"vf":{},"vostfr":{"1":{"vidzy":"https://vidzy.org/embed-...html","luluvid":"https://luluvdo.com/e/..."}}}` : les clés de langue sont `vf`/`vostfr`, les clés d’épisode sont numériques et chaque épisode contient plusieurs serveurs.

`https://french-stream.one/engine/ajax/film_api.php?id=15134151` renvoie un JSON contenant `players`, avec des groupes `premium`, `vidzy`, `dood` et `voe`, et leurs variantes `default`/`vfq`. Les liens sont des pages d’embed, par exemple `fsvid.lol`, `vidzy.cc` et `kakaflix.lol`.

La recherche French-Stream utilise `/index.php?do=search&subaction=search&story=...`. Les cartes de résultat contiennent un lien `a.short-poster` avec `href` et `alt`; des fiches de série réelles utilisent `?newsid=<id>` et contiennent un bloc `.episodes-wrapper`. French-Manga utilise une recherche POST vers `/engine/ajax/search.php` avec `query` et `page`, et les cartes contiennent également `a.short-poster` avec `newsid`.

Sources consultées : [Zangetsu providers README](https://github.com/Spyou/zangetsu-providers/blob/main/README.md), [Zangetsu provider template](https://github.com/Spyou/Zangetsu/blob/main/providers/_template.js), [FrenchStreamProvider.kt](https://github.com/Nikola17/cloudstream-frenchstream/blob/main/FrenchStreamProvider/src/main/kotlin/com/lagradost/FrenchStreamProvider.kt), [FrenchMangaProvider.kt](https://github.com/Nikola17/cloudstream-frenchstream/blob/main/FrenchManga/src/main/kotlin/com/lagradost/FrenchMangaProvider.kt), [MovixProvider.kt](https://github.com/Nikola17/cloudstream-frenchstream/blob/main/Movix/src/main/kotlin/com/lagradost/MovixProvider.kt), [Gowaru manifest](https://github.com/Gowaru/gowaru-nuvio-providers/blob/main/manifest.json).

Le smoke test initial a renvoyé `https://s1.fsvid.lol/troll/master.m3u8`, qui est un faux média de démonstration et a donc été filtré. Le décodeur de référence de FrenchStream (`FrenchStreamPackedPlayer.kt`) recherche `var k=[...], b=atob(s)` dans le lecteur, décode la base64 puis applique un XOR cyclique avec la clé numérique ; la source n’est acceptée que si elle commence par `http://` ou `https://`. Cette logique doit être portée dans l’extracteur Fsvid avant de considérer la résolution comme positive.

## Diagnostic du 16 août 2026 — Naruto THE LAST

La recherche French-Manga `Naruto THE LAST` renvoie `https://w16.french-manga.net/1498754-naruto-the-last-le-film-saison-1-2014.html`. L’API `manga_episodes_api.php` donne deux épisodes, VF et VOSTFR, avec les embeds `https://vidzy.org/embed-5ck4q7dstz54.html` et `https://vidhsareup.io/embed-56syzjjf8ogu.html`. Dans le harness Zangetsu, `getVideoSources()` retourne une liste vide pour les deux langues.

L’embed Vidzy testé le 16 août 2026 répond HTTP 200 mais contient le faux flux de démonstration `https://s1.fsvid.lol/troll/master.m3u8` ainsi qu’une redirection `https://vidzy.org/premium.html`; il ne fournit donc pas de source gratuite exploitable pour cet épisode. Le domaine `vidhsareup.io` n’a pas résolu depuis le sandbox au moment du test (`NameResolutionError`), donc son lecteur n’a pas pu être inspecté ou validé.

Le modèle Dart `ProviderType` de Zangetsu accepte uniquement `anime`, `movie`, `manga` et `novel`, pas `tv`. Les fonctions `result()` de Movix, `cards()`/`getDetail()` de French-Stream et `tvDetail()` de Movix renvoient encore `type: 'tv'` pour les séries, ce qui peut faire échouer la désérialisation de `getHome`, `search` ou `getDetail` dans l’application même si le harness JS brut les considère valides. L’appel Dart `getHome()` transmet `{category: ...}` et désérialise chaque `items` en `MediaItem`; `getVideoSources()` transmet exactement l’identifiant d’épisode et désérialise chaque entrée en `VideoSource`.

Sources externes et code consulté : [Zangetsu Episode model](https://github.com/Spyou/Zangetsu/blob/main/lib/core/models/episode.dart), [Zangetsu VideoSource model](https://github.com/Spyou/Zangetsu/blob/main/lib/core/models/video_source.dart), [Zangetsu ProviderType](https://github.com/Spyou/Zangetsu/blob/main/lib/core/models/provider_info.dart), [French-Manga Naruto page](https://w16.french-manga.net/1498754-naruto-the-last-le-film-saison-1-2014.html), [Vidzy Naruto embed](https://vidzy.org/embed-5ck4q7dstz54.html), [Vidhsareup Naruto embed](https://vidhsareup.io/embed-56syzjjf8ogu.html).


## Diagnostic 2026-08-16 — Naruto THE LAST et contrat Zangetsu

- Fiche testée : https://w16.french-manga.net/1498754-naruto-the-last-le-film-saison-1-2014.html
- API d’épisodes : https://w16.french-manga.net/engine/ajax/manga_episodes_api.php?id=1498754
- Les liens VF/VOSTFR retournés sont `https://vidzy.org/embed-5ck4q7dstz54.html` et `https://vidhsareup.io/embed-56syzjjf8ogu.html`.
- Vidzy répond HTTP 200 mais renvoie une page Premium et le flux de démonstration `https://s1.fsvid.lol/troll/master.m3u8`, qui est volontairement filtré comme faux média.
- VidShareUp `.io` ne résout plus son domaine (`curl` erreur DNS, status 000). Le miroir `.fun` testé avec le même identifiant est également inaccessible. `vidstream.pro` répond une page de domaine à vendre et ne fournit aucun flux.
- Le provider French-Manga retourne donc correctement une liste vide pour cet épisode précis, car les deux serveurs fournis par le site sont actuellement inutilisables ; il ne s’agit pas d’une URL HLS exploitable masquée par le parser.
- Après correction, `getHome()` de French-Stream et Movix renvoie des sections non vides. Movix et French-Stream utilisent désormais `type: "movie"` pour satisfaire l’énumération ProviderType de Zangetsu, et les années sont des chaînes.
- Suite d’intégration : 7 tests réussis sur 7 avant la vérification ciblée Naruto ; le diagnostic ciblé confirme toutefois `sources=[]` pour Naruto à cause de l’indisponibilité des hôtes ci-dessus.
- Référence publique utilisée pour la logique générique : provider VoirAnime de `gowaru-nuvio-providers`, qui classe `vidhsareup` dans le résolveur générique et filtre aussi `/troll/master.m3u8`.
