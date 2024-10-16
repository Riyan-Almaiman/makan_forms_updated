using forms_api.Entities;
using Microsoft.EntityFrameworkCore;
using static forms_api.Entities.SheetEntities;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<WeeklyTarget> WeeklyTargets { get; set; }
    public DbSet<Form> Forms { get; set; }
    public DbSet<Links> Links { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Sheet> Sheets { get; set; }

    public DbSet<DailySheetAssignments> DailySheets { get; set; }
    public DbSet<SheetLayerStatus> SheetLayerStatus { get; set; }
    public DbSet<DailyTarget> DailyTargets { get; set; }
    public DbSet<OTPEntity> OTPEntities { get; set; }
    public DbSet<Calculation> Calculations { get; set; }
    public DbSet<Approval> Approvals { get; set; }
    public DbSet<Targets> Targets { get; set; }
    public DbSet<Layer> Layers { get; set; }
    public DbSet<Remark> Remarks { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<SheetAssignment> SheetAssignments { get; set; }
   
}
