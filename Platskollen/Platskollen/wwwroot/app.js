const map = L.map('map').setView([65.8153, 15.0867], 13);

//lägger till kartlagret från Openstreetmap
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

const placesList = document.getElementById('placesList');
const searchInput = document.getElementById('searchInput');
const markers = L.layerGroup().addTo(map);

const instructionModal = document.getElementById('mapInstructionModal');
const instructionOkButton = document.getElementById('instructionOkButton');
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


//bygger popup rutan med text content så att text från användaren aldrig tolkas som html
function popupFor(place) {
    const div = document.createElement('div');

    const title = document.createElement('strong');
    title.textContent = place.name;

    const category = document.createElement('p');
    category.textContent = `Kategori: ${place.category}`;

    const description = document.createElement('p');
    description.textContent = `Beskrivning: ${place.description}` || 'Ingen beskrivning tillgänglig';

    const coordinates = document.createElement('p');
    coordinates.textContent = `Koordinater: ${place.latitude}, ${place.longitude}`;

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

//visar platser i listan på kartan
function showPlaces(places) {
    //tömmer listan
    placesList.innerHTML = '';
    //tar bort gamla markörer från kartan
    markers.clearLayers();
    //går igenom alla platser och lägger till dem i listan och på kartan
    places.forEach(place => {
        const marker = L.marker([place.latitude, place.longitude]).addTo(markers);

        // Popup med platsens information
        marker.bindPopup(popupFor(place));

        // Skapar ett listelement
        const listItem = document.createElement('li');
        listItem.classList.add('place-item');

        // Platsens namn
        const name = document.createElement('h3');
        name.textContent = place.name;

        // Platsens kategori
        const category = document.createElement('p');
        category.textContent = place.category;

        // Samlar namn och kategori i en egen container
        const placeInfo = document.createElement('div');
        placeInfo.append(name, category);

        // Skapar en container för kapparna
        const actions = document.createElement('div');
        actions.classList.add('place-actions');

        //skapar ändraknappen
        const editButton = document.createElement('button');
        editButton.textContent = 'Ändra';

        //skapar ta bortknappen
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Ta bort';

        //lägger till knapparna i containern
        actions.append(editButton, deleteButton);

        //klicket på ändraknappen
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();

            //sparar vilken plats som ska ändras
            editingPlaceId = place.id;

            //fyller formuläret med platsens befintliga information
            document.getElementById('placeName').value = place.name;
            document.getElementById('placeCategory').value = place.category;
            document.getElementById('placeDescription').value = place.description;
            document.getElementById('placeLatitude').value = place.latitude;
            document.getElementById('placeLongitude').value = place.longitude;

            //ändrar rubriken på formuläret
            modal.querySelector('h2').textContent = 'Ändra plats';
            modal.classList.add('show');
        })

        //klicka på ta bort knappen
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();

            // Sparar vilken plats som ska tas bort
            deletingPlaceId = place.id;

            // Visar vilken plats användaren vill ta bort
            deletePlaceMessage.textContent =
                `Vill du verkligen ta bort ${place.name}?`;

            // Öppnar bekräftelserutan
            deletePlaceModal.classList.add('show');
        });

        //lägger till information om knappar i "plats-kortet"
        listItem.append(placeInfo, actions);

        placesList.appendChild(listItem);

        // Klick på platsen zoomar in på kartan
        listItem.addEventListener('click', () => {

            map.setView([
                place.latitude,
                place.longitude
            ], 15);

            marker.openPopup();

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
    instructionModal.classList.add('show');
});

//knappen för att bekräfta instruktionen
instructionOkButton.addEventListener('click', () => {

    instructionModal.classList.remove('show');

    //aktiverar möjligheten att klicka på kartan
    addingPlace = true;

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

    modal.querySelector('h2').textContent = 'Lägg till en plats';
});

//knappen för att spara platsen
addPlaceForm.addEventListener('submit', async (e) => {
    //förhindrar att sidan laddas om
    e.preventDefault();


    //hämtar informationen från formuläret
    const newPlace = {
        name: document.getElementById('placeName').value,
        category: document.getElementById('placeCategory').value,
        description: document.getElementById('placeDescription').value,
        latitude: parseFloat(document.getElementById('placeLatitude').value),
        longitude: parseFloat(document.getElementById('placeLongitude').value)
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

        await loadPlaces();
    } else {
        alert('Det gick inte att spara platsen... Vänligen försök igen.');
    }
});

//Kör funktionen när sidan laddas
loadPlaces();

