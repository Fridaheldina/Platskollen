using System.Globalization;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;

var builder = WebApplication.CreateBuilder(args);

//anslutniingen till sql server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<PlaceDb>(options => options.UseSqlServer(connectionString, o => o.UseNetTopologySuite()));

var app = builder.Build();

//Serverar index.html och app.js från mappen wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

var places = app.MapGroup("/api/places");

//hämtar alla platser
places.MapGet("/", async (PlaceDb db) =>
    (await db.Places.AsNoTracking().ToListAsync()).Select(p => p.ToDto()));

//hämtar en plats med ett id
places.MapGet("/{id}", async (int id, PlaceDb db) =>
{
    var place = await db.Places.FindAsync(id);

    return place is not null
    ? Results.Ok(place)
    : Results.NotFound();
});

// skapa plats
places.MapPost("/", async (PlaceDto place, PlaceDb db) =>
{
    Place placeDb = new();
    placeDb.Name = place.Name;
    placeDb.Category = place.Category;
    placeDb.Description = place.Description;
    placeDb.CreatedAt = DateTime.UtcNow;

    //kontrollerar vilken typ av objekt som skickas
    if (place.GeometryType == "Point")
    {
        if (place.Latitude == null || place.Longitude == null)
        {
            return Results.BadRequest("En punkt måste ha latitude och longitud");
        }

        var point = new WKTReader().Read(string.Format(CultureInfo.InvariantCulture, "POINT ({0} {1})", place.Longitude, place.Latitude)); // Hemavan, lon lat
        point.SRID = 4326;

        placeDb.Geometry = point;
    }
    else if (place.GeometryType == "Polygon")
    {
        if (string.IsNullOrWhiteSpace(place.Wkt))
        {
            return Results.BadRequest("En polygon måste ha WKT-information");
        }

        // Omvandla wkt till geometry
        var polygon = new WKTReader().Read(place.Wkt);
        polygon.SRID = 4326;

        placeDb.Geometry = polygon;

    }
    else
    {
        return Results.BadRequest("Ogiltig geometrityp");
    }

    db.Places.Add(placeDb);
    await db.SaveChangesAsync();
    return Results.Created($"/api/places/{place.Id}", place);
});

//spatial sökning
places.MapPost("/search", async (SearchRequest request, PlaceDb db) =>
{
    //1.läs request.Wkt till en Geometry och sätt SRID 4326
    var reader = new WKTReader();
    Geometry searchGeometry;

    try
    {
        searchGeometry = reader.Read(request.Wkt);
        searchGeometry.SRID = 4326;
    }
    catch (Exception)
    {
        return Results.BadRequest("Ogiltigt WKT-format...");
    }

    // //2.räkna om till ditt lagringssystem om det inte är WGS84
    // const int targetSrid = 4326;
    // if (searchGeometry.SRID != targetSrid)
    // {
    //     searchGeometry = TransformGeometry(searchGeometry, searchGeometry.SRID, targetSrid);
    // }

    //3. hämta platserna vars Geometry skär sökpolygonen 
    var matchingPlaces = await db.Places
    .Where(p => p.Geometry.Intersects(searchGeometry))
    .ToListAsync();

    //4.returnera dom i samma DTO som GET /api/places
    var response = matchingPlaces.Select(p => p.ToDto());
    
    return Results.Ok(response);
});


//uppdatera en plats
places.MapPut("/{id}", async (int id, Place input, PlaceDb db) =>
{
    var place = await db.Places.FindAsync(id);
    if (place is null) return Results.NotFound();

    //uppdaterar endast information om platsen
    place.Name = input.Name;
    place.Category = input.Category;
    place.Description = input.Description;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

//ta bort en plats via id
places.MapDelete("/{id}", async (int id, PlaceDb db) =>
{
    var place = await db.Places.FindAsync(id);
    if (place is null) return Results.NotFound();

    db.Places.Remove(place);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

//record för requesten
record SearchRequest(string Wkt);

