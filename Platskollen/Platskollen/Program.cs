using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//anslutniingen till mysql
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<PlaceDb>(options => options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

var app = builder.Build();

//skapar databasfilen först gången appen startar
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<PlaceDb>().Database.EnsureCreated();
}

//Serverar index.html och app.js från mappen wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

var places = app.MapGroup("/api/places");

//hämtar alla platser
places.MapGet("/", async (PlaceDb db) =>
await db.Places.ToListAsync());

//hämtar en plats med ett id
places.MapGet("/{id}", async (int id, PlaceDb db) =>
{
    var place = await db.Places.FindAsync(id);

    return place is not null
    ? Results.Ok(place)
    : Results.NotFound();
});

//skapa plats
places.MapPost("/", async (Place place, PlaceDb db) =>
{

    //kontrollerar vilken typ av objekt som skickas
    if (place.GeometryType == "Point")
    {
        if (place.Latitude == null || place.Longitude == null)
        {
            return Results.BadRequest("En punkt måste ha latitude och longitud");
        }
        place.Wkt = null;
    }
    else if (place.GeometryType == "Polygon")
    {
        if (string.IsNullOrWhiteSpace(place.Wkt))
        {
            return Results.BadRequest("En polygon måste ha WKT-information");
        }
        place.Latitude = null;
        place.Longitude = null;
    }
    else
    {
        return Results.BadRequest("Ogiltig geometrityp");
    }
    place.CreatedAt = DateTime.UtcNow;
    db.Places.Add(place);
    await db.SaveChangesAsync();
    return Results.Created($"/api/places/{place.Id}", place);
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