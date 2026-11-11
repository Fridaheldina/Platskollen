const map = L.map('map').setView([59.3326, 18.0649], 13);

//lägger till kartlagret från Openstreetmap
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

const placesList = document.getElementById('placesList');

//bygger popup rutan med text content så att text från användaren aldrig tolkas som html
function popupFor(place) {
    const div = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = place.name;
    div.append(title, document.createElement('br'), place.category);
    return div;
}

function addMarker(place) {
    L.marker([place.latitude, place.longitude])
    .addTo(map)
    .bindPopup(popupFor(place));
}

async function loadPlaces() {
    const response = await fetch('/api/places');
    const places = await response.json();
    placesList.innerHTML = '';
    places.forEach(place => {

        // Skapa en markör på kartan
        const marker = L.marker([
            place.latitude,
            place.longitude
        ]).addTo(map);

        // Lägg till popup med platsens namn
        marker.bindPopup(place.name);

        // Skapa ett listelement
        const listItem = document.createElement('li');
        listItem.classList.add('place-item');

        //platsens namn
        const name = document.createElement('h3');
        name.textContent = place.name;

        //platsens kategori
        const category = document.createElement('p');
        category.textContent = place.category;

        // Lägger till namn och kategori i listelementet
        listItem.append(name, category);

        // Lägger till platsen i listan
        placesList.appendChild(listItem);

        // Klicka på platsen i listan för att hitta den på kartan
        listItem.addEventListener('click', () => {
            map.setView([
                place.latitude,
                place.longitude
            ], 15);

            marker.openPopup();
        });

    });
}

map.on('click', async (e) => {
    const name = prompt('Vad heter platsen?');
    if (!name) return;

    const response = await fetch('/api/places', {
        body: JSON.stringify({
            name,
            category: 'övrigt',
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
        })
    });
    addMarker(await response.json());
});

//Kör funktionen när sidan laddas
loadPlaces();

