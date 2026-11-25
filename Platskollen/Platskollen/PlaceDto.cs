using NetTopologySuite.Geometries;
using NetTopologySuite.IO;

public record PlaceDto(
    int Id,
    string Name,
    string Category,
    string? Description,
    double? Latitude,
    double? Longitude,
    string? Wkt,
    string GeometryType,
    DateTime CreatedAt);

public static class PlaceMapping
{
    //från entitet till DTO, det API:t skickar till klienten
    public static PlaceDto ToDto(this Place place)
    {
        if (place.Geometry is Point point)
        {
            // I WGS84 är X longitude och Y latitud
            return new PlaceDto(place.Id, place.Name, place.Category, place.Description, point.Y, point.X, null, "Point", place.CreatedAt);
        }
        string wkt = new WKTWriter().Write(place.Geometry);
        return new PlaceDto(place.Id, place.Name, place.Category, place.Description, null, null, wkt, "Polygon", place.CreatedAt);
    }
}