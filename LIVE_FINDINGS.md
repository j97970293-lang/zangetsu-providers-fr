# Observations live

Les vérifications du 15 août 2026 ont confirmé que `https://french-stream.one/`, `https://w16.french-manga.net/` et `https://movix.fun/` répondent en HTTP 200 avec un user-agent navigateur. `https://api.movix.fun/` répond en HTTP 404 à la racine, ce qui confirme que les routes API doivent être appelées directement.

`https://w16.french-manga.net/engine/ajax/manga_episodes_api.php?id=1498810` renvoie un JSON de la forme `{"vf":{},"vostfr":{"1":{"vidzy":"https://vidzy.org/embed-...html","luluvid":"https://luluvdo.com/e/..."}}}` : les clés de langue sont `vf`/`vostfr`, les clés d’épisode sont numériques et chaque épisode contient plusieurs serveurs.

`https://french-stream.one/engine/ajax/film_api.php?id=15134151` renvoie un JSON contenant `players`, avec des groupes `premium`, `vidzy`, `dood` et `voe`, et leurs variantes `default`/`vfq`. Les liens sont des pages d’embed, par exemple `fsvid.lol`, `vidzy.cc` et `kakaflix.lol`.

La recherche French-Stream utilise `/index.php?do=search&subaction=search&story=...`. Les cartes de résultat contiennent un lien `a.short-poster` avec `href` et `alt`; des fiches de série réelles utilisent `?newsid=<id>` et contiennent un bloc `.episodes-wrapper`. French-Manga utilise une recherche POST vers `/engine/ajax/search.php` avec `query` et `page`, et les cartes contiennent également `a.short-poster` avec `newsid`.

Sources consultées : [Zangetsu providers README](https://github.com/Spyou/zangetsu-providers/blob/main/README.md), [Zangetsu provider template](https://github.com/Spyou/Zangetsu/blob/main/providers/_template.js), [FrenchStreamProvider.kt](https://github.com/Nikola17/cloudstream-frenchstream/blob/main/FrenchStreamProvider/src/main/kotlin/com/lagradost/FrenchStreamProvider.kt), [FrenchMangaProvider.kt](https://github.com/Nikola17/cloudstream-frenchstream/blob/main/FrenchManga/src/main/kotlin/com/lagradost/FrenchMangaProvider.kt), [MovixProvider.kt](https://github.com/Nikola17/cloudstream-frenchstream/blob/main/Movix/src/main/kotlin/com/lagradost/MovixProvider.kt), [Gowaru manifest](https://github.com/Gowaru/gowaru-nuvio-providers/blob/main/manifest.json).
