# Architecture de Zangetsu Providers FR

Le dépôt reprend le modèle de manifeste de Zangetsu : `index.json` référence plusieurs fichiers JavaScript autonomes, chacun exposant `getInfo`, `search`, `getDetail`, `getEpisodes` et `getVideoSources`. Les providers ne chargent pas de dépendances npm ; ils utilisent uniquement `fetch`, `extractVideo`, `htmlText` et `absUrl` fournis par le runtime.

## Périmètre fonctionnel de la première version

| Provider | Type | Découverte | Lecture | Serveurs visés |
| --- | --- | --- | --- | --- |
| French-Stream | Films et séries | Recherche DLE/HTML, fiches numériques, API `film_api.php` et `ep-data.php` | Direct MP4/HLS ou extraction d’embed | Uqload, Fsvid, Kokoflix, Vidzy, Vidoza, Voe, Vidmoly, Wishonly, Lulustream, Goodstream, OK.ru, Mp4upload, Streamlare, Doodstream |
| French-Manga | Anime et films d’animation | Recherche AJAX DLE, fiches `newsid`, saisons et épisodes par API | Liens directs MP4/HLS depuis lecteur packé, sinon extracteur | Uqload, Fsvid, Vidzy, Vidoza, Voe, Vidmoly, Sendvid, Myvi, Sibnet, Younetu, Streamtape, OK.ru, Mp4upload |
| Movix | Films et séries | TMDB via API publique intégrée au provider, avec identifiants TMDB | Endpoints FStream, Custom et Wiflix puis extracteurs | Tous les liens retournés par les groupes FStream/Custom/Wiflix, notamment Uqload, Fsvid, Vidzy, Voe, Younetu, Sendvid, Sibnet, Vidmoly, Vidoza, Streamtape, Myvi |

## Extracteurs ajoutés

Les extracteurs Zangetsu existants couvrent DoodStream, Mp4upload, OK.ru et Streamlare. La version française ajoute des extracteurs tolérants et indépendants pour les hôtes récurrents recensés dans les dépôts français : Uqload, Vidoza, Vidmoly, Voe, Streamtape, Sendvid, Myvi, Sibnet, Younetu, Vidzy et Fsvid. Chaque extracteur renvoie uniquement des URLs HTTP(S) média détectées ; un hôte qui change de structure renvoie une liste vide plutôt qu’un faux lien.

## Choix de compatibilité

Les bundles NuVio sont des modules Node compilés et ne sont pas directement exécutables dans le sandbox JavaScript de Zangetsu : ils attendent l’API Stremio/Nuvio et exposent principalement `getStreams`, alors que Zangetsu exige la séparation recherche/détail/épisodes/lecture. L’implémentation porte donc les endpoints et parseurs observables, sans copier le runtime NuVio ni ses dépendances.

Les serveurs et domaines restent dépendants de la disponibilité et des conditions d’accès de chaque site. Le dépôt documente les domaines connus et conserve les fallbacks de miroir lorsque cela est possible.
