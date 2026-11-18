const map = L.map('map').setView([65.8153, 15.0867], 13);

//lägger till kartlagret från Openstreetmap
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

const placesList = document.getElementById('placesList');
const searchInput = document.getElementById('searchInput');
const markers = L.layerGroup().addTo(map);

//grupp som håller reda på dom ritade polygonerna
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

//hämta knappaen för att rita polygoner
const drawPolygonButton = document.getElementById('drawPolygonButton');

//väljer färg på kartnålen beroende på vilken kategori som platsen tillhör
function getMarkerIcon(category) {
    const colors = {
        'Boenden': 'violet',
        'Restaurang': 'red',
        'Butik': 'grey',
        'Utflyktsmål': 'green',
        'Aktiviteter': 'blue',
        'Svampställe': 'gold'
    };

    const color = colors[category] || 'blue';

    return L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

const instructionModal = document.getElementById('mapInstructionModal');
const instructionOkButton = document.getElementById('instructionOkButton');

const instructionTitle = document.getElementById('instructionTitle');
const instructionText = document.getElementById('instructionText');
//hämtar formulärets element från HTML
const addPlaceButton = document.getElementById('addPlaceButton');
const modal = document.getElementById('addPlaceModal');
const addPlaceForm = document.getElementById('addPlaceForm');
const cancelButton = document.getElementById('cancelButton');
// Element till bekräftelserutan
const deletePlaceModal = document.getElementById('deletePlaceModal');
const deletePlaceMessage = document.getElementById('deletePlaceMessage');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');
//hämtar alla filterknappar
const filterButtons = document.querySelectorAll('.filter-button');

let selectedCategories = []; //sparar användarens valda kategorier
let deletingPlaceId = null;
let addingPlace = false;
let allPlaces = []; //sparar alla platser som hämtas från databasen
let editingPlaceId = null;

let pendingPolygonWkt = null;
let pendingPolygonLayer = null;

let instructionMode = 'place';


//bygger popup rutan med text content så att text från användaren aldrig tolkas som html
function popupFor(place) {
    const div = document.createElement('div');

    const title = document.createElement('strong');
    title.textContent = place.name;

    const category = document.createElement('p');
    category.textContent = `Kategori: ${place.category}`;

    const description = document.createElement('p');
    
    description.textContent = `Beskrivning: ${place.description || 'Ingen beskrivning tillgänglig'}`;
    const coordinates = document.createElement('p');

    if (place.geometryType === "Polygon") {
        coordinates.textContent = "Typ: Område";
    } else {
        coordinates.textContent =
            `Koordinater: ${place.latitude}, ${place.longitude}`;
    }

    div.append(title, category, description, coordinates);
    return div;
}


async function loadPlaces() {
    const response = await fetch('/api/places');
    allPlaces = await response.json();

    console.log(allPlaces);

    applyFilters(); //visar alla platser
}

// Filtrerar platser baserat på sökning och kategori
function applyFilters() {

    const searchText = searchInput.value.toLowerCase().trim();

    const filteredPlaces = allPlaces.filter(place => {

        // Kontrollerar sökningen
        const matchesSearch =
            place.name.toLowerCase().includes(searchText) ||
            place.category.toLowerCase().includes(searchText);

        // Kontrollerar vald kategori
        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(place.category);

        return matchesSearch && matchesCategory;
    });

    // Visar endast de platser som matchar filtreringen
    showPlaces(filteredPlaces);
}

// Lyssnar efter klick på filterknapparna
filterButtons.forEach(button => {

    button.addEventListener('click', () => {

        const category = button.dataset.category;
        console.log("Vald kategori:", category);

        // Om användaren väljer Alla
        if (category === 'all') {

            selectedCategories = [];

        } else {

            // Tar bort Alla som aktivt val
            selectedCategories = selectedCategories.filter(
                selected => selected !== 'all'
            );

            // Om kategorin redan är vald tas den bort
            if (selectedCategories.includes(category)) {

                selectedCategories = selectedCategories.filter(
                    selected => selected !== category
                );

            } else {

                // Annars läggs kategorin till
                selectedCategories.push(category);

            }
        }

        // Uppdaterar vilka knappar som är aktiva
        filterButtons.forEach(filterButton => {

            const filterCategory = filterButton.dataset.category;

            filterButton.classList.toggle(
                'active',
                filterCategory === 'all'
                    ? selectedCategories.length === 0
                    : selectedCategories.includes(filterCategory)
            );

        });

        // Uppdaterar kartan och listan
        applyFilters();

    });

});


// Omvandlar en WKT-polygon till koordinater som Leaflet kan använda
function parsePolygonWkt(wkt) {

    const coordinatesText = wkt.match(
        /^POLYGON\s*\(\((.*)\)\)$/i
    );

    if (!coordinatesText) {
        return null;
    }

    return coordinatesText[1].split(',').map(pair => {

        const [longitude, latitude] = pair.trim()
            .split(/\s+/)
            .map(Number);

        // Leaflet använder latitud först
        return [latitude, longitude];
    });
}


//visar platser i listan på kartan
function showPlaces(places) {

    // Tömmer listan
    placesList.innerHTML = '';

    // Tar bort gamla objekt från kartan
    markers.clearLayers();
    drawnItems.clearLayers();

    // Går igenom alla sparade platser
    places.forEach(place => {

        let mapLayer;

        // Kontrollerar om objektet är en polygon
        if (place.geometryType === "Polygon" && place.wkt) {

            const coordinates = parsePolygonWkt(place.wkt);

            if (!coordinates) {
                console.error("Ogiltig WKT:", place.wkt);
                return;
            }

            // Skapar polygonen på kartan
            mapLayer = L.polygon(coordinates, {
                color: '#527B96',
                fillColor: '#527B96',
                fillOpacity: 0.3
            }).addTo(drawnItems);

        } else {

            // Skapar en vanlig punktmarkör
            mapLayer = L.marker(
                [place.latitude, place.longitude],
                { icon: getMarkerIcon(place.category) }
            ).addTo(markers);

        }

        // Popup med information
        mapLayer.bindPopup(popupFor(place));

        // Skapar ett listelement
        const listItem = document.createElement('li');
        listItem.classList.add('place-item');

        // Platsens namn
        const name = document.createElement('h3');
        //skapar en ikon beroende på vilken typ objektet har
        const typeIcon = document.createElement('i');

        if (place.geometryType === "Polygon") {
            typeIcon.classList.add('fa-solid', 'fa-draw-polygon');
        } else {
            typeIcon.classList.add('fa-solid', 'fa-location-dot');
        }

        //lägger til en css klass för ikonen
        typeIcon.classList.add('place-type-icon');
        //lägger till ikonen och platsens namn
        name.append(typeIcon, document.createTextNode(` ${place.name}`));

        // Platsens kategori
        const category = document.createElement('p');
        category.textContent = place.category;
        category.classList.add('place-category');
        category.classList.add(`category-${place.category.toLowerCase()}`);

        // Samlar namn och kategori
        const placeInfo = document.createElement('div');
        placeInfo.append(name, category);

        // Container för knapparna
        const actions = document.createElement('div');
        actions.classList.add('place-actions');

        // Ändra-knapp
        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
        editButton.classList.add('edit-button');
        editButton.title = 'Ändra plats';
        editButton.setAttribute('aria-lable', 'Ändra plats');

        // Ta bort-knapp
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteButton.classList.add('delete-button');
        deleteButton.title = 'Ta bort plats';
        deleteButton.setAttribute('arial-label', 'Ta bort plats');

        actions.append(editButton, deleteButton);

        // Klick på Ändra
        editButton.addEventListener('click', (e) => {

            e.stopPropagation();
            editingPlaceId = place.id;

            document.getElementById('placeName').value = place.name;
            document.getElementById('placeCategory').value = place.category;
            document.getElementById('placeDescription').value = place.description || '';
            //om det är en punktplats så visas koordinaterna
            //är det ett polygon så lämnas koordinaterna tomma
            document.getElementById('placeLatitude').value = place.geometryType === "Point" ? place.latitude : '';
            document.getElementById('placeLongitude').value = place.geometryType === "Point" ? place.longitude : '';

            modal.querySelector('h2').textContent = place.geometryType === "Polygon" ? 'Ändra område' : 'Ändra plats';
            modal.classList.add('show');
        });

        // Klick på Ta bort
        deleteButton.addEventListener('click', (e) => {

            e.stopPropagation();

            deletingPlaceId = place.id;

            deletePlaceMessage.textContent =
                `Vill du verkligen ta bort ${place.name}?`;

            deletePlaceModal.classList.add('show');
        });

        // Lägger till information och knappar
        listItem.append(placeInfo, actions);
        placesList.appendChild(listItem);

        // Klick på listelementet zoomar in på objektet
        listItem.addEventListener('click', () => {

            if (place.geometryType === "Polygon") {

                map.fitBounds(mapLayer.getBounds());

            } else {

                map.setView([
                    place.latitude,
                    place.longitude
                ], 15);

            }

            mapLayer.openPopup();
        });

    });
}


//användaren bekräftar borttagningen
confirmDeleteButton.addEventListener('click', async () => {
    const response = await fetch(`/api/places/${deletingPlaceId}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        deletePlaceModal.classList.remove('show');
        deletingPlaceId = null;

        await loadPlaces();
    } else {
        alert('Det gick inte att ta bort platsen.');
    }
});

//användaren avbryter borttagningen
cancelDeleteButton.addEventListener('click', () => {
    deletePlaceModal.classList.remove('show');
    deletingPlaceId = null;
});

/// Lyssnar efter vad användaren skriver i sökfältet
searchInput.addEventListener('input', applyFilters);

//klicka på knappen : lägg till plats
addPlaceButton.addEventListener('click', () => {
    instructionMode = 'place';
    instructionTitle.textContent = 'Lägg till en ny plats';
    instructionText.textContent = 'Klicka på kartan för att välja var du vill placera din plats';
    instructionModal.classList.add('show');
});

//klicka på knappen för att rita ett område
drawPolygonButton.addEventListener('click', () => {
    instructionMode = 'polygon';
    instructionTitle.textContent = 'Rita ett område på kartan';
    instructionText.textContent = 'Klicka på kartan för att markera hörnen på området du vill skapa -> klicka sedan på den första punkten igen för att avsluta ritningen.';
    instructionModal.classList.add('show');
});

//när användaren har ritat klart en polygon
map.on(L.Draw.Event.CREATED, (e) => {
    const layer = e.layer;
    //sparar polygonen
    drawnItems.addLayer(layer);
    pendingPolygonLayer = layer;
    //hämtar polygonens koordinater
    const coordinates = layer.getLatLngs()[0];
    //omvandlar koordinaterna till WKT-formatet
    const wktCoordinates = coordinates.map(point =>
        `${point.lng} ${point.lat}`
    );
    //avslutar polygonen genom att upprepa första koordinaten
    wktCoordinates.push(wktCoordinates[0]);
    //skapar WKT-strängen
    pendingPolygonWkt = `POLYGON((${wktCoordinates.join(', ')}))`;

    console.log("WTK:", pendingPolygonWkt);

    //förbereder formuläret
    editingPlaceId = null;
    addPlaceForm.reset();

    document.getElementById('placeLatitude').value = '';
    document.getElementById('placeLongitude').value = '';

    modal.querySelector('h2').textContent = 'Spara område';

    //öppnar formuläret
    modal.classList.add('show');
});

//knappen för att bekräfta instruktionen
instructionOkButton.addEventListener('click', () => {

    instructionModal.classList.remove('show');

    //kontrollerar vilken funktion användaren har valt
    if (instructionMode === 'place') {
        //aktiverar möjligheten att lägga till en plats
        addingPlace = true;
    } else if (instructionMode === 'polygon') {
        //aktiverar polygonritning
        const polygonDrawer = new L.Draw.Polygon(map, {
            shapeOptions: {
                color: '#527B96',
                fillColor: '#527B96',
                fillOpacity: 0.3
            },
            allowIntersection: false,
            showArea: true
        });
        polygonDrawer.enable();
    }

});

//klicka på kartan
map.on('click', (e) => {
    if (!addingPlace) return;

    editingPlaceId = null;
    addPlaceForm.reset();
    modal.querySelector('h2').textContent = 'Lägg till en plats';

    document.getElementById('placeLatitude').value = e.latlng.lat;
    document.getElementById('placeLongitude').value = e.latlng.lng;

    modal.classList.add('show');

    addingPlace = false;
});

//knappen för att avbryta lägg till plats
cancelButton.addEventListener('click', () => {
    modal.classList.remove('show');
    addPlaceForm.reset();
    editingPlaceId = null;

    if (pendingPolygonLayer) {
        drawnItems.removeLayer(pendingPolygonLayer);
    }

    pendingPolygonWkt = null;
    pendingPolygonLayer = null;

    modal.querySelector('h2').textContent = 'Lägg till en plats';
});

//knappen för att spara platsen
addPlaceForm.addEventListener('submit', async (e) => {
    //förhindrar att sidan laddas om
    e.preventDefault();


    //hämtar informationen från formuläret
    const isPolygon = pendingPolygonWkt !== null;

    const newPlace = {
        name: document.getElementById('placeName').value,
        category: document.getElementById('placeCategory').value,
        description: document.getElementById('placeDescription').value,

        latitude: isPolygon ? null :
            parseFloat(document.getElementById('placeLatitude').value),
        longitude: isPolygon ? null :
            parseFloat(document.getElementById('placeLongitude').value),
        wkt: isPolygon ? pendingPolygonWkt : null,
        geometryType: isPolygon ? "Polygon" : "Point"
    };

    //kontrollerar om vi sk askapa eller ändra en plats
    const url = editingPlaceId
        ? `/api/places/${editingPlaceId}`
        : `/api/places`;

    const method = editingPlaceId ? 'PUT' : 'POST';

    //skickar informationen till API:et
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPlace)
    });

    //kontrollerar om platsen sparades
    if (response.ok) {
        modal.classList.remove('show');
        addPlaceForm.reset();
        editingPlaceId = null;

        //rensar information om evemtuell polygon
        pendingPolygonWkt = null;
        pendingPolygonLayer = null;

        await loadPlaces();
    } else {
        alert('Det gick inte att spara platsen. Vänligen försök igen på nytt!');
    }
});

//Kör funktionen när sidan laddas
loadPlaces();

