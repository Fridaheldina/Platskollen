Information om platskollen:
Platskollen är en webbaserad applikation där användaren kan spara, utforska och hitta intressanta platser och områden på en interaktiv karta. Applikationen gör det enkelt att samla sparade platser och områden i en gemensam lista, som användaren sedan kan använda sig av för att enkelt navigera till dom sparade platserna om områdena, även redigera eller ta bort som sparade objekten.

Funktioner i applikationen:
- Visa och utforska platser på en interaktiv karta
- Lägga till nya platser genom att välja en position direkt på kartan
- Lägga till nya områden genom att rita polygoner på kartan
- Söka bland dom sparade platserna
- Filtrera platser på kartan utifrån olika kategorier
- Redigera dom sparade platserna
- Ta bort en sparad plats

Tekniker som projektet använder sig av:
- C# / ASP.NET Core Web API -> Backend och hanterar kommunikationen mellan databasen och webbapplikationen
- HTML -> Sätter applikationens struktur och innehåll
- CSS -> Bestämmer webbplatsens utseende, färger och layout
- JavaScript -> Gör webbplatsen interaktiv och hanterar vad som händer när användaren använder olika funktioner
- MySQL -> Databasen som lagrar informationen om platserna
- Leaflet -> Den interaktiva kartfunktionaliteten
- OpenStreetMap -> Kartadata och kartlager

Förutsättningar för att kunna köra och starta applikationen:
- .NET SDK
- MySQL Server
- Visual Studio Code

Installation och uppstart av projektet Platskollen:
1. Klona ner projektet från GitHub
2. Öppna projektet i Visual Studio Code
3. Se till att alla nödvändiga verktyg och program är installerade
4. Koppla projektet till MySQL-databasen
5. Starta projektet (Starta projektet i terminalen: dotnet run)
6. Öppna upp webbapplikationen i en webbläsare -> http://localhost:5166/
