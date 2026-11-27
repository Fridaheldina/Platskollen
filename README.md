Information om platskollen:
Platskollen är en webbaserad applikation där användaren kan spara, utforska och hitta intressanta platser och områden på en interaktiv karta. Applikationen gör det enkelt att samla sparade platser och områden i en gemensam lista, som användaren sedan kan använda sig av för att enkelt navigera till dom sparade platserna om områdena, även redigera eller ta bort som sparade objekten.

Funktioner i applikationen:
- Visa och utforska platser på en interaktiv karta
- Lägga till nya platser genom att välja en position direkt på kartan
- Lägga till nya områden genom att rita polygoner på kartan
- Söka bland dom sparade platserna
- Söka platser inom ett valt geografiskt område på kartan
- Filtrera platser på kartan utifrån olika kategorier
- Redigera dom sparade platserna
- Ta bort en sparad plats

Tekniker som projektet använder sig av:
- C# / ASP.NET Core Web API -> Backend och hanterar kommunikationen mellan databasen och webbapplikationen
- EF Core (Entity Framework Core) -> Modernt plattformsberoende, ORM som gör det enkelt att hantera kommunikationen mellan applikationen och databasen
- WKT -> Textformat som används för att beskriva geografiska objekt
- HTML -> Sätter applikationens struktur och innehåll
- CSS -> Bestämmer webbplatsens utseende, färger och layout
- JavaScript -> Gör webbplatsen interaktiv och hanterar vad som händer när användaren använder olika funktioner
- SQL Server -> Databasen som lagrar informationen om platserna
- SSMS -> Används för att ansluta till databasen och för att kunna hantera SQL Server databasen
- NetTopologySuite -> Källkods-bibliotek som hanterar och analyserar geografisk och spatial data
- Leaflet -> Den interaktiva kartfunktionaliteten
- OpenStreetMap -> Kartadata och kartlager

Förutsättningar för att kunna köra och starta applikationen:
- .NET SDK
- SQL Server
- SSMS (SQL Server Management Studio)
- Visual Studio Code

Installation och uppstart av projektet Platskollen:
1. Klona ner projektet från GitHub
2. Öppna projektet i Visual Studio Code
3. Se till att alla nödvändiga verktyg och program är installerade
4. Konfigurera anslutningen till SQL Server i projektets appsettings.json
5. Kontrollera att SQL Server körs och att uppgifterna för anslutningen stämmer
6. Starta projektet (Starta projektet i terminalen: dotnet run)
7. Öppna upp webbapplikationen i en webbläsare -> http://localhost:5166/

Databasen:
Platskollen använder SQL Server för att lagra information om sparade platser och geografiska områden. 
Både punktplatser och polygoner lagras som geometriska objekt i en gemensam kolumn av typen geometry.

Med SSMS (SQL Server Management Studio) kan du ansluta till SQL Server, öppna Platskollens databas och granska den information som blivit lagrad i databasen.
