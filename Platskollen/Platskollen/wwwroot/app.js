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

let addingPlace = false;
let allPlaces = []; //sparar alla platser som hämtas från databasen


//bygger popup rutan med text content så att text från användaren aldrig tolkas som html
function popupFor(place) {
    const div = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = place.name;
    div.append(title, document.createElement('br'), place.category);
    return div;
}


async function loadPlaces() {
    const response = await fetch('/api/places');
    allPlaces = await response.json();

    showPlaces(allPlaces); //visar alla platser

}       

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

        // Lägger till informationen i listan
        listItem.append(name, category);

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

//lyssnar efter vad användaren skriver i sökfältet 
searchInput.addEventListener('input', () => {
    const searchText = searchInput.value.toLowerCase();

    const filteredPlaces = allPlaces.filter(place =>
        place.name.toLowerCase().includes(searchText) ||
        place.category.toLowerCase().includes(searchText)
    );

    showPlaces(filteredPlaces);
});

        

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
    document.getElementById('placeLatitude').value = e.latlng.lat;

    document.getElementById('placeLongitude').value = e.latlng.lng;

    modal.classList.add('show');

    addingPlace = false;
});    

//knappen för att avbryta lägg till plats
cancelButton.addEventListener('click', () => {
    modal.classList.remove('show');
    addPlaceForm.reset();
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

    //skickar informationen till API:et
    const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPlace)
    });

    //kontrollerar om platsen sparades
    if (response.ok) {
        modal.classList.remove('show');
        addPlaceForm.reset();

        //laddar om sidan för att visa den nya platsen
        window.location.reload();
    } else {
        alert('Det gick inte att lägga till platsen... Vänligen fFörsök igen.');
    }
});

//Kör funktionen när sidan laddas
loadPlaces();

