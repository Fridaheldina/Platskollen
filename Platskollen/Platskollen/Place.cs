using NetTopologySuite.Geometries;

public class Place
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }

    public Geometry Geometry { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
    
}