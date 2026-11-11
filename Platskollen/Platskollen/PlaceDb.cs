
using Microsoft.EntityFrameworkCore;

public class PlaceDb : DbContext
{
    public PlaceDb(DbContextOptions<PlaceDb> options)
        : base(options)
    {
    }

    public DbSet<Place> Places => Set<Place>();
}
