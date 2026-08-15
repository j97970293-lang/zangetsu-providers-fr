# Zangetsu Providers FR

Collection francophone de providers pour [Zangetsu](https://github.com/Spyou/Zangetsu). Le dépôt suit le format officiel de manifeste : ajoutez l’URL de `index.json` dans **Settings → Sources → Add repo** de Zangetsu.

```text
https://raw.githubusercontent.com/j97970293-lang/zangetsu-providers-fr/main/index.json
```

| Provider | Catalogue | Serveurs intégrés |
| --- | --- | --- |
| French-Stream | Films et séries | Fsvid, Vidzy, Uqload, Kokoflix, Voe, Vidoza, Vidmoly, Luluvdo et extracteurs Zangetsu compatibles |
| French-Manga | Anime, saisons et films d’animation | Vidzy, Luluvdo, Fsvid, Uqload, Voe, Vidoza, Vidmoly, Sendvid, Myvi, Sibnet, Younetu, Streamtape et extracteurs compatibles |
| Movix | Films et séries indexés par TMDB | Tous les liens retournés par les groupes FStream, Custom et Wiflix de l’API Movix, puis résolution automatique par hôte |

Les extracteurs du dossier `extractors/` couvrent les hôtes vidéo fréquemment retournés par ces sites : **Uqload, Vidzy, Fsvid, Voe, Vidoza, Vidmoly, Sendvid, Myvi, Sibnet, Younetu, Streamtape, Kokoflix et Luluvdo**, en plus des extracteurs officiels conservés pour DoodStream, Mp4upload, OK.ru et Streamlare.

Les sites de streaming changent parfois de domaine, de lecteur ou de structure HTML. Les providers utilisent plusieurs miroirs lorsque cela est possible et renvoient uniquement les liens média effectivement résolus. Une indisponibilité d’un serveur ne bloque pas les autres serveurs du même épisode.

Le code est distribué sous licence MIT. Voir `ARCHITECTURE.md` et `LIVE_FINDINGS.md` pour le détail du portage et les endpoints observés.
