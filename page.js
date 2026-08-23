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

      // 1. Befüllen des pageTitles-Objekts für jeden Song
      songs.forEach(song => {
        if (song.url && song.titel) {
          pageTitles[song.url] = `${song.titel} – Mundharmonika Tabs & Noten`;
        }
      });

      populateCategories();
      renderTable(songs);
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
      <td><a onclick="loadContent('${song.url}')">${song.titel}</a></td>
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
  // Stellt sicher, dass der Pfad immer absolut ist (z. B. "/pages/einsteiger-infos.html")
  let cleanPath = pageUrl.replace(/^\/+|\/+$/g, '');

  fetch('/' + cleanPath)
    .then(response => {
      if (!response.ok) throw new Error('HTTP-Fehler: ' + response.status);
      return response.text();
    })
    .then(html => {
      const container = document.getElementById('main-content');
      container.innerHTML = html;

      // Inline-Scripte nativ durch Re-Insertion ausführen
      const scripts = Array.from(container.querySelectorAll('script'));
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }

        // Altes Script-Tag durch ausführbares neues ersetzen
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      updateSEO(cleanPath);

      if (pushToHistory) {
        history.pushState({ pageUrl: cleanPath }, '', '/' + cleanPath);
      }

      // Nach dem Ersetzen die Songtabelle initialisieren, falls Startseite
      if ((cleanPath === 'main-content.html' || cleanPath === '') && typeof initSongTable === 'function') {
        initSongTable();
      }
    })
    .catch(error => {
      console.error('Fehler beim Laden von ' + pageUrl + ':', error);
      document.getElementById('main-content').innerHTML = '<p>Inhalt konnte nicht geladen werden.</p>';
    });
}

// Aktualisiert den Browser-Titel basierend auf der geladenen URL
function updateSEO(pageUrl) {
  console.log(pageUrl);
  if (pageTitles[pageUrl]) {
    document.title = pageTitles[pageUrl];
  } else {
    // Fallback, falls die URL nicht im Objekt enthalten ist
    document.title = "Mundharmonika Lieder & Tabs";
  }
}

function loadSidebar() {
  fetch('./pages/sidebar-content.html')
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
  let path = window.location.pathname.substring(1); // Entfernt das führende "/"
  
  if (!path || path === '' || path === 'index.html') {
    path = 'main-content.html';
  }

  loadContent(path, false);
  loadSidebar();
});

window.addEventListener('popstate', (event) => {
  if (event.state && event.state.pageUrl) {
    loadContent(event.state.pageUrl, false);
  } else {
    // Fallback auf Startseite
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
        //alert(tabParts + " -> " + tabPart + " -> " + kind);
        let len = 3; // quarter note
        let startIdxTabText = 1;
        if (kind >= '0' && kind <= '9') {
          console.log(kind, ' is number');
          len = kind;
          startIdxTabText = 2;
          kind = tabPart.slice(1, 2);
        }
        let tabText = tabPart.slice(startIdxTabText);
        //console.log('kind:', kind, ',len:', len, ',tabText:', tabText);
         
        if (kind == '-') { // draw
          cellHtml += '<font class="pad draw d' + len + '">' + tabText + '</font>';
        } else if (kind == '+') { // blow
          cellHtml += '<font class="pad blow b' + len + '">' + tabText + '</font>';
        } else if (kind == 'r') { // rest
          cellHtml += '<font class="pad rest r' + len + '">-</font>';
        } else if (kind == 't') { // text
          cellHtml += '<font class="pad text">' + tabText + '</font>';
        }
      }
    }
    cell.innerHTML = cellHtml;
  }
}