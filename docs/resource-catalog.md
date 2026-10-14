# Learning catalog, reviewed 2026-10-14

`lib/resources.json` contains curated links to educational catalogs/platforms, not a claimed inventory of their individual lessons. UI filters distinguish content languages, approximate school stages, subjects and formats. Favorites/history are device-local.

Free core learning content is the inclusion criterion. Paid certificates, optional products and account requirements are separately indicated. Public-domain book collections may also contain restricted works: follow the originating library's access rules. Content availability and national curricula vary.

The review checked HTTP responses and page titles for 71 candidates. The closed schule-bw.de portal was replaced by MUNDO. The UC3M endpoint returning 502 was replaced by UNED Abierta. Procomún returned 500 and was omitted. Some publisher sites challenge automated requests (Khan Academy, Gallica, OER Commons, RFI, Canal-U, BNE); HTTP 200 is not by itself proof of usable content.

Publisher evidence consulted for these and major collections:
- https://www.lumni.fr/
- https://manuel.sesamath.net/index.php?page=liste_manuels
- https://www.exo7.emath.fr/prof.html
- https://mathalea.fr/
- https://www.college-de-france.fr/fr/audios-videos
- https://www.bnf.fr/fr/gallica-la-bibliotheque-numerique-de-la-bnf-et-de-ses-partenaires
- https://support.khanacademy.org/hc/fr/articles/202260114-Est-ce-payant-d-utiliser-Khan-Academy
- https://ocw.mit.edu/pages/get-started/
- https://openstax.org/k12
- https://www.open.edu/openlearn/free-courses
- https://cs50.harvard.edu/x/
- https://help.oercommons.org/support/solutions/articles/42000046848-welcome-to-oer-commons
- https://learnenglish.britishcouncil.org/
- https://de.serlo.org/
- https://www.leifiphysik.de/
- https://www.planet-schule.de/
- https://www.vhs-lernportal.de/wws/ueber-das-vhs-lernportal.php
- https://mundo.schule/
- https://fwu.de/portale/
- https://intef.es/recursos-educativos/
- https://proyectodescartes.org/uudd/
- https://www.apuntesmareaverde.org.es/grupos/mat/LOMLOE/LOMLOE.html
- https://www.bne.es/es/catalogos/biblioteca-digital-hispanica
- https://canal.uned.es/
- https://unedabierta.uned.es/
- https://phet.colorado.edu/fr/simulations/translated

Maintenance: open replacement links before changing catalog URLs; don't add expired trials or label premium products as free. Avoid counting language variants as separate underlying catalogs in marketing. New entries need unique IDs and HTTPS URLs, checked by `tests/new-learning-tools.mjs`.
