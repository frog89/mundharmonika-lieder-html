let allSongs = [];

let pageTitles = {
  'main-content.html': "Mundharmonika Lieder & Tabs – Songs für Blues Harp",
  'pages/einsteiger-infos.html': "Mundharmonika für Anfänger – Kaufberatung & Tipps | Blues Harp vs. Chrom",
  'pages/mundharmonika-links.html': "Mundharmonika Links & Tools – Bending, Tabs & Zubehör"
};

// Lädt all-songs.json und befüllt die Tabelle sowie das pageTitles-Objekt
function initSongTable() {
  fetch('all-songs.json')
    .then(response => {
      if (!response.ok) throw new Error('all-songs.json konnte nicht geladen werden');
      return response.json();
    })
    .then(songs => {
      allSongs = songs;

      // Befüllen des pageTitles-Objekts für jeden Song
      songs.forEach(song => {
        if (song.url && song.titel) {
          // Entfernt führende Slashes für sauberen Key-Match
          const cleanUrl = song.url.replace(/^\/+|\/+$/g, '');
          pageTitles[cleanUrl] = `${song.titel} – Mundharmonika Tabs & Noten`;
        }
      });

      populateCategories();
      renderTable(songs);

      // Aktualisiert den Titel nochmals, falls die Songseite vor der JSON geladen wurde
      const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (currentPath) updateSEO(currentPath);
    })
    .catch(error => {
      console.error('Fehler beim Initialisieren der Songtabelle:', error);
    });
}

// Füllt das Dropdown-Menü dynamisch mit Kategorien
function populateCategories() {
  const select = document.getElementById('category-filter');
  if (!select) return;

  const categories = [...new Set(allSongs.map(song => song.kategorie))];
  select.innerHTML = '<option value="Alle">Alle Kategorien</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// Rendert die Tabellenzeilen
function renderTable(songs) {
  const tbody = document.getElementById('song-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  songs.forEach(song => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a onclick="loadContent('${song.url}')" style="cursor:pointer; text-decoration:underline;">${song.titel}</a></td>
      <td>${song.kategorie}</td>
      <td>${song.art}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Filtert die Daten je nach Auswahl
function filterSongs() {
  const selectedCategory = document.getElementById('category-filter').value;
  if (selectedCategory === 'Alle') {
    renderTable(allSongs);
  } else {
    const filtered = allSongs.filter(song => song.kategorie === selectedCategory);
    renderTable(filtered);
  }
}

function loadContent(pageUrl, pushToHistory = true) {
  // 1. Pfad säubern (Slashes am Anfang und Ende entfernen)
  let cleanPath = pageUrl.replace(/^\/+|\/+$/g, '');

  if (!cleanPath || cleanPath === 'index.html') {
    cleanPath = 'main-content.html';
  }

  // 2. Fetch-Pfad aus dem snippets-Ordner
  const fetchUrl = '/snippets/' + cleanPath;

  fetch(fetchUrl)
    .then(response => {
      if (!response.ok) throw new Error('HTTP-Fehler: ' + response.status);
      return response.text();
    })
    .then(html => {
      const container = document.getElementById('main-content');
      container.innerHTML = html;

      // Inline-Scripte ausführen
      const scripts = Array.from(container.querySelectorAll('script'));
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // SEO-Titel aktualisieren
      updateSEO(cleanPath);

      // 3. Browser-History aktualisieren
      if (pushToHistory) {
        history.pushState({ pageUrl: cleanPath }, '', '/' + cleanPath);
      }

      // Falls Startseite geladen wurde, Songtabelle initialisieren
      if (cleanPath === 'main-content.html') {
        initSongTable();
      }
    })
    .catch(error => {
      console.error('Fehler beim Laden von ' + fetchUrl + ':', error);
      document.getElementById('main-content').innerHTML = '<p>Inhalt konnte nicht geladen werden.</p>';
    });
}

// Aktualisiert den Browser-Titel basierend auf der geladenen URL
function updateSEO(pageUrl) {
  const cleanUrl = pageUrl.replace(/^\/+|\/+$/g, '');
  if (pageTitles[cleanUrl]) {
    document.title = pageTitles[cleanUrl];
  } else {
    document.title = "Mundharmonika Lieder & Tabs";
  }
}

function loadSidebar() {
  fetch('/snippets/pages/sidebar-content.html')
    .then(response => {
      if (!response.ok) throw new Error('Fehler beim Laden der Sidebar');
      return response.text();
    })
    .then(html => {
      const sidebarContainer = document.getElementById('sidebar-content');
      if (sidebarContainer) {
        sidebarContainer.innerHTML = html;
      }
    })
    .catch(error => console.error('Fehler:', error));
}

// Beim Start aufrufen
window.addEventListener('DOMContentLoaded', () => {
  // Liest den Pfad ab und säubert führende/nachfolgende Slashes
  let path = window.location.pathname.replace(/^\/+|\/+$/g, '');

  if (!path || path === 'index.html') {
    path = 'main-content.html';
  }

  // Lade immer auch all-songs.json für SEO-Titel
  initSongTable();

  loadContent(path, false);
  loadSidebar();
});

window.addEventListener('popstate', (event) => {
  if (event.state && event.state.pageUrl) {
    loadContent(event.state.pageUrl, false);
  } else {
    loadContent('main-content.html', false);
  }
});

function row(columns) {
  const table = document.currentScript.closest('table');
  var row = table.insertRow();

  for (i=0; i<columns.length; i++) {
    let column = columns[i];
    var cell = row.insertCell();
    let cellHtml = "";

    let tabs = column.split(' ');
    for (j=0; j<tabs.length; j++) {
      let tab = tabs[j];
      if (j > 0) {
        cellHtml += "&nbsp;&nbsp;&nbsp;";
      }

      let tabParts = tab.split('&')
      for (k=0; k<tabParts.length; k++) {
        let tabPart = tabParts[k];
  
        let kind = tabPart.slice(0, 1);
        let len = 3;
        let startIdxTabText = 1;
        if (kind >= '0' && kind <= '9') {
          len = kind;
          startIdxTabText = 2;
          kind = tabPart.slice(1, 2);
        }
        let tabText = tabPart.slice(startIdxTabText);
          
        if (kind == '-') {
          cellHtml += '<font class="pad draw d' + len + '">' + tabText + '</font>';
        } else if (kind == '+') {
          cellHtml += '<font class="pad blow b' + len + '">' + tabText + '</font>';
        } else if (kind == 'r') {
          cellHtml += '<font class="pad rest r' + len + '">-</font>';
        } else if (kind == 't') {
          cellHtml += '<font class="pad text">' + tabText + '</font>';
        }
      }
    }
    cell.innerHTML = cellHtml;
  }
}