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


## Diagnostic de résolution multi-provider — 2026-08-16

- Zangetsu mobile charge seulement quatre extracteurs intégrés (Doodstream, Mp4upload, OK.ru et Streamlare). Les fichiers `extractors/*.js` présents dans ce dépôt ne sont pas automatiquement chargés par l’application ; un provider doit donc résoudre directement les hôtes supplémentaires.
- French-Manga One Piece `https://w16.french-manga.net/1498700-one-piece-saison-23-1999.html` retourne des liens Vidzy et Luluvdo ; Luluvdo produit un flux HLS réel.
- French-Manga Naruto THE LAST `https://w16.french-manga.net/1498754-naruto-the-last-le-film-saison-1-2014.html` retourne Vidzy et VidShareUp. Les deux résolutions testées retournent actuellement zéro source ; Vidzy renvoie un flux de démonstration `/troll/master.m3u8` filtré et VidShareUp ne fournit pas de flux exploitable.
- French-Stream retourne actuellement des embeds `fsvid.lol`, `vidzy.cc`, `uqload.is` et `kakaflix.lol`; les extracteurs du dépôt ne sont pas suffisants dans l’application mobile. Les embeds testés pour le film courant renvoient un flux de démonstration ou une réponse 403.
- Movix API `https://api.movix.fun/api/fstream/movie/693134`, `/api/links/movie/693134`, `/api/wiflix/movie/693134` et les routes TV répondent en HTTP 200 et retournent des embeds, notamment Fsvid, Vidzy, Uqload, Kakaflix, Bysebuho et Embedseek. `getVideoSources` retournait zéro car il déléguait tous ces hôtes à `extractVideo`, alors que l’application ne les enregistre pas.
- Les providers French-Stream et Movix doivent intégrer des résolveurs directs pour Fsvid/Vidzy/Uqload et filtrer les faux flux ; les hôtes premium, 403 ou réellement hors service ne peuvent pas produire de source sans flux public valide.


### Structure exacte API Movix Dune

La réponse `https://api.movix.fun/api/fstream/movie/693134` contient `players` sous forme de groupes de langue (`VFQ`, `VFF`, `VOSTFR`, `Default`), chacun étant un tableau d’objets `{url,type,quality,player}`. Les URLs observées incluent `fsvid.lol`, `vidzy.cc`, `uqload.is`, `kakaflix.lol`, `mixdrop.ag` et plusieurs chemins `newPlayer.php`. La collecte actuelle de Movix parcourt les clés des objets mais ne descend pas correctement dans les tableaux, ce qui explique `links=[]` dans le diagnostic même lorsque l’API renvoie 17 lecteurs.


## Validation v1.0.6 — 2026-08-16

Le décompacteur Uqload a été validé sur un lecteur `eval(function(p,a,c,k,e,d){...})` à base 36 : il récupère bien le flux `master.m3u8` réel après expansion du dictionnaire. Le motif initial exigeait deux antislashs et ne correspondait pas au HTML ; il a été corrigé dans les trois providers.

Les tests ciblés dans le harness du runtime Zangetsu ont ensuite produit les résultats suivants :

| Provider et titre | Serveurs résolus | Résultat |
|---|---|---|
| French-Stream — Dune : Deuxième partie | Uqload | 2 sources HLS |
| French-Manga — One Piece, épisode 1 | Luluvdo | 1 source HLS |
| Movix — Dune : Deuxième partie | Uqload et Luluvdo | 4 sources HLS |
| Movix — The Last of Us, épisode 1 | Uqload | 12 sources HLS |

Le parser Movix descend désormais dans les tableaux et objets de `players`, puis les URLs Kakaflix, Bysebuho et Embedseek sont suivies vers leurs iframes lorsque celles-ci sont disponibles. Les pages Kakaflix testées le 16 août 2026 étaient toutefois supprimées ou en erreur Cloudflare ; leur prise en charge est donc présente mais ne peut pas être déclarée active pour ces identifiants précis.

Les limites déjà observées restent valables : Fsvid peut renvoyer HTTP 403, Vidzy peut renvoyer `/troll/master.m3u8` ou une page Premium, et VidShareUp peut être indisponible par DNS. Ces cas sont filtrés ou retournent une liste vide plutôt qu’un faux flux. Les tests live ne garantissent pas la disponibilité permanente des hôtes tiers.


## Retour utilisateur — lecteurs et qualité — 2026-08-16

Le modèle `VideoSource` de Zangetsu affiche d’abord `label`, puis ajoute `quality`; si `quality` vaut littéralement `Unknown`, l’interface affiche ce texte. Les sources actuelles construisent `quality` uniquement à partir d’un motif `2160|1080|720|480|360` présent dans l’URL HLS finale. Les URLs signées Uqload et Luluvdo ne contiennent pas cette résolution, d’où `Unknown`.

Les réponses French-Stream observées contiennent les groupes `premium`, `vidzy`, `uqload`, `dood`, `voe` et `filmoon`; chaque groupe contient des variantes `default`, `vostfr`, `vff` et `vfq`. La réponse Movix sauvegardée contient 17 lecteurs : Fsvid, Vidzy, Uqload, Kakaflix vers Dood/Voe/Filmoon et Mixdrop, tous avec `quality: "HD"` et un champ `player`. French-Manga One Piece expose Vidzy et Luluvdo/Luluvid ; certains épisodes exposent aussi VidShareUp.

Le provider actuel perd ces métadonnées en réduisant les objets API à des chaînes URL. Le correctif doit transporter `server`, `lang` et `quality` jusqu’à la résolution, produire par exemple `label: "[VF] Uqload"` et `quality: "HD"`, et ne plus émettre `Unknown`. Les formats de parser de référence observés dans Gowaru gèrent `players`, `links`, `episodes[episode].languages`, les tableaux de langue et les champs `player`/`name`/`quality`.

Références de code consultées : [Zangetsu VideoSource](https://github.com/Spyou/Zangetsu/blob/main/lib/core/models/video_source.dart), [Gowaru Frenchstream extractor](https://github.com/Gowaru/gowaru-nuvio-providers/blob/main/src/frenchstream/extractor.js), [Gowaru Movix extractor](https://github.com/Gowaru/gowaru-nuvio-providers/blob/main/src/movix/extractor.js), [French-Stream film API](https://french-stream.one/engine/ajax/film_api.php?id=15116633), [French-Manga episode API](https://w16.french-manga.net/engine/ajax/manga_episodes_api.php?id=1498700).
