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

//Serverar index.html och app.js från mappen wwwroot (steg6)
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
    place.CreatedAt = DateTime.UtcNow;
    db.Places.Add(place);
    await db.SaveChangesAsync();
    return Results.Created($"/api/places/{place.Id}", place);
});

//uppdatera en plats
places.MapPut("/{id}", async (int id, Place input, PlaceDb db) =>
{
    var place = await db.Places.FindAsync (id);
    if (place is null) return Results.NotFound();

    place.Name = input.Name;
    place.Category = input.Category;
    place.Description = input.Description;
    place.Latitude = input.Latitude;
    place.Longitude = input.Longitude;
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