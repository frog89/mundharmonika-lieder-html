let allSongs = [];

const pageTitles = {
    'main-content': 'Mundharmonika Lieder & Tabs – Songs für Blues Harp',
    'pages/einsteiger-infos': 'Mundharmonika für Anfänger – Kaufberatung & Tipps | Blues Harp vs. Chrom',
    'pages/mundharmonika-links': 'Mundharmonika Links & Tools – Bending, Tabs & Zubehör'
};


/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */

// Entfernt führende und abschließende Slashes
function cleanPath(path) {
    return path.replace(/^\/+|\/+$/g, '');
}


// Ermittelt die interne Seiten-ID aus der Browser-URL
function getCurrentPage() {
    let path = cleanPath(window.location.pathname);

    // Startseite
    if (!path || path === 'index.html') {
        return 'main-content';
    }

    // .html entfernen, falls jemand eine solche URL aufruft
    if (path.endsWith('.html')) {
        path = path.slice(0, -5);
    }

    return path;
}


/* =========================================================
   SEO
   ========================================================= */

function updateSEO(pageUrl) {
    const cleanUrl = cleanPath(pageUrl);
    console.log('cleanUrl: ', cleanUrl);

    if (pageTitles[cleanUrl]) {
        document.title = pageTitles[cleanUrl];
    } else {
        document.title = 'Mundharmonika Lieder & Tabs';
    }

    // 2. Robots Meta-Tag dynamisch steuern
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
    }

    // Seiten, die NICHT von Google indiziert werden sollen:
    if (cleanUrl === 'pages/impressum' || cleanUrl === 'pages/datenschutz') {
        metaRobots.content = 'noindex, nofollow';
    } else {
        metaRobots.content = 'index, follow';
    }
}


/* =========================================================
   SONG-TABELLE
   ========================================================= */

function initSongTable() {

    fetch('/all-songs.json')
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    'all-songs.json konnte nicht geladen werden: ' +
                    response.status
                );
            }

            return response.json();
        })

        .then(songs => {

            allSongs = songs;

            // SEO-Titel für Songs erzeugen
            songs.forEach(song => {

                if (song.url && song.titel) {

                    const cleanUrl = cleanPath(song.url)
                        .replace(/\.html$/, '');

                    pageTitles[cleanUrl] =
                        `${song.titel} – Mundharmonika Tabs & Noten`;
                }
            });

            populateCategories();
            renderTable(allSongs);

            // Nach dem Laden der Songs den Titel
            // der aktuell geöffneten Seite aktualisieren
            const currentPage = getCurrentPage();

            if (currentPage) {
                updateSEO(currentPage);
            }
        })

        .catch(error => {
            console.error(
                'Fehler beim Initialisieren der Songtabelle:',
                error
            );
        });
}


/* =========================================================
   KATEGORIEN
   ========================================================= */

function populateCategories() {

    const select = document.getElementById('category-filter');

    if (!select) {
        return;
    }

    const categories = [
        ...new Set(
            allSongs
                .map(song => song.kategorie)
                .filter(Boolean)
        )
    ];

    select.innerHTML = '<option value="Alle">Alle Kategorien</option>';

    categories.forEach(category => {

        const option = document.createElement('option');

        option.value = category;
        option.textContent = category;

        select.appendChild(option);
    });
}


/* =========================================================
   SONG-TABELLE RENDERN
   ========================================================= */

function renderTable(songs) {

    const tbody = document.getElementById('song-table-body');

    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    songs.forEach(song => {

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>
                <a
                    href="/${cleanPath(song.url)}"
                    onclick="loadContent('${cleanPath(song.url)}'); return false;"
                    style="cursor:pointer; text-decoration:underline;"
                >
                    ${song.titel}
                </a>
            </td>

            <td>${song.kategorie || ''}</td>
            <td>${song.art || ''}</td>
        `;

        tbody.appendChild(tr);
    });
}


/* =========================================================
   SONG-FILTER
   ========================================================= */

function filterSongs() {

    const select = document.getElementById('category-filter');

    if (!select) {
        return;
    }

    const selectedCategory = select.value;

    if (selectedCategory === 'Alle') {

        renderTable(allSongs);

    } else {

        const filtered = allSongs.filter(
            song => song.kategorie === selectedCategory
        );

        renderTable(filtered);
    }
}


/* =========================================================
   SEITE / SNIPPET LADEN
   ========================================================= */

function loadContent(pageUrl, pushToHistory = true) {

    let cleanPage = cleanPath(pageUrl);

    /*
     * Startseite
     */
    if (!cleanPage || cleanPage === 'index.html') {
        cleanPage = 'main-content';
    }

    /*
     * .html entfernen
     *
     * Beispiel:
     *
     * pages/test.html
     *
     * wird zu:
     *
     * pages/test
     */
    cleanPage = cleanPage.replace(/\.html$/, '');


    /*
     * Daraus wird der tatsächliche Snippet-Pfad:
     *
     * pages/test
     *      ↓
     * /snippets/pages/test.html
     */
    const fetchUrl = `/snippets/${cleanPage}.html`;

    console.log('Lade Seite:', cleanPage);
    console.log('Snippet:', fetchUrl);


    fetch(fetchUrl)

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}: ${fetchUrl}`
                );
            }

            return response.text();
        })

        .then(html => {

            const container =
                document.getElementById('main-content');

            if (!container) {
                throw new Error(
                    '#main-content wurde nicht gefunden'
                );
            }


            /*
             * HTML des Snippets einsetzen
             */
            container.innerHTML = html;


            /*
             * Scripts aus dem geladenen Snippet
             * erneut ausführen
             */
            const scripts =
                Array.from(container.querySelectorAll('script'));

            scripts.forEach(oldScript => {

                const newScript =
                    document.createElement('script');


                if (oldScript.src) {

                    /*
                     * Relative Script-URLs auflösen
                     */
                    newScript.src =
                        new URL(
                            oldScript.src,
                            window.location.origin
                        ).href;

                } else {

                    newScript.textContent =
                        oldScript.textContent;
                }


                /*
                 * Attribute übernehmen
                 */
                Array.from(oldScript.attributes).forEach(attr => {

                    if (attr.name !== 'src') {
                        newScript.setAttribute(
                            attr.name,
                            attr.value
                        );
                    }
                });


                oldScript.parentNode.replaceChild(
                    newScript,
                    oldScript
                );
            });


            /*
             * Browser-Titel aktualisieren
             */
            updateSEO(cleanPage);


            /*
             * Browser-History aktualisieren
             */
            if (pushToHistory) {

                const browserUrl =
                    cleanPage === 'main-content'
                        ? '/'
                        : `/${cleanPage}`;

                history.pushState(
                    {
                        pageUrl: cleanPage
                    },
                    '',
                    browserUrl
                );
            }


            /*
             * Song-Tabelle nur auf der Startseite
             */
            if (cleanPage === 'main-content') {
                initSongTable();
            }
        })

        .catch(error => {

            console.error(
                'Fehler beim Laden von ' + fetchUrl,
                error
            );

            const container =
                document.getElementById('main-content');

            if (container) {

                container.innerHTML = `
                    <p>
                        Inhalt konnte nicht geladen werden.
                    </p>
                `;
            }
        });
}


/* =========================================================
   SIDEBAR
   ========================================================= */

function loadSidebar() {

    fetch('/snippets/pages/sidebar-content.html')

        .then(response => {

            if (!response.ok) {
                throw new Error(
                    'Fehler beim Laden der Sidebar'
                );
            }

            return response.text();
        })

        .then(html => {

            const sidebarContainer =
                document.getElementById('sidebar-content');

            if (sidebarContainer) {
                sidebarContainer.innerHTML = html;
            }
        })

        .catch(error => {

            console.error(
                'Fehler beim Laden der Sidebar:',
                error
            );
        });
}


/* =========================================================
   START
   ========================================================= */

window.addEventListener('DOMContentLoaded', () => {

    /*
     * Aktuelle Browser-URL ermitteln
     *
     * /
     * /pages/einsteiger-infos
     * /songs/house-of-the-rising-sun
     */
    const currentPage = getCurrentPage();

    console.log('Aktuelle Seite:', currentPage);


    /*
     * Songdaten laden
     *
     * Wichtig:
     * Das passiert unabhängig davon,
     * welche Unterseite geöffnet wurde.
     */
    initSongTable();


    /*
     * Aktuelle Seite laden
     *
     * false = keinen neuen History-Eintrag erzeugen
     */
    loadContent(currentPage, false);


    /*
     * Sidebar laden
     */
    loadSidebar();
});


/* =========================================================
   BACK / FORWARD
   ========================================================= */

window.addEventListener('popstate', event => {

    if (event.state && event.state.pageUrl) {

        loadContent(
            event.state.pageUrl,
            false
        );

    } else {

        /*
         * Falls kein History-State vorhanden ist,
         * URL erneut auslesen.
         */
        const currentPage = getCurrentPage();

        loadContent(
            currentPage,
            false
        );
    }
});


/* =========================================================
   TAB-ZEILEN
   ========================================================= */

function row(columns) {

    const table =
        document.currentScript.closest('table');

    const tableRow =
        table.insertRow();


    for (let i = 0; i < columns.length; i++) {

        const column = columns[i];

        const cell =
            tableRow.insertCell();

        let cellHtml = '';

        const tabs =
            column.split(' ');


        for (let j = 0; j < tabs.length; j++) {

            const tab = tabs[j];

            if (j > 0) {
                cellHtml += '&nbsp;&nbsp;&nbsp;';
            }


            const tabParts =
                tab.split('&');


            for (let k = 0; k < tabParts.length; k++) {

                let tabPart =
                    tabParts[k];

                let kind =
                    tabPart.slice(0, 1);

                let len = 3;

                let startIdxTabText = 1;


                /*
                 * Zahl vor dem Tab:
                 *
                 * 2-xxx
                 * 4+xxx
                 */
                if (
                    kind >= '0' &&
                    kind <= '9'
                ) {

                    len =
                        parseInt(kind, 10);

                    startIdxTabText = 2;

                    kind =
                        tabPart.slice(1, 2);
                }


                const tabText =
                    tabPart.slice(startIdxTabText);


                if (kind === '-') {

                    cellHtml +=
                        `<font class="pad draw d${len}">` +
                        tabText +
                        '</font>';

                } else if (kind === '+') {

                    cellHtml +=
                        `<font class="pad blow b${len}">` +
                        tabText +
                        '</font>';

                } else if (kind === 'r') {

                    cellHtml +=
                        `<font class="pad rest r${len}">-</font>`;

                } else if (kind === 't') {

                    cellHtml +=
                        `<font class="pad text">` +
                        tabText +
                        '</font>';
                }
            }
        }

        cell.innerHTML = cellHtml;
    }
}