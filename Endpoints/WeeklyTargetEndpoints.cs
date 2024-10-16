using forms_api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

public static class WeeklyTargetEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/weekly-targets", GetAllWeeklyTargets)
            .WithName("GetAllWeeklyTargets");




        app.MapGet("/api/weekly-targets/product/{productId}/role/{productionRole}/week", GetWeeklyTargetsByProductRoleAndWeek)
            .WithName("GetWeeklyTargetsByProductRoleAndWeek");


        app.MapPost("/api/weekly-targets/createOrUpdate", CreateOrUpdateWeeklyTarget)
            .WithName("CreateOrUpdateWeeklyTarget");


        app.MapGet("/api/weekly-targets/daily-targets", GetDailyTargets)
            .WithName("GetDailyTargets");
    }

    private static async Task<IResult> GetAllWeeklyTargets(
        [FromServices] ApplicationDbContext db)
    {
        var weeklyTargets = await db.WeeklyTargets
            .Include(wt => wt.Product)
            .Include(wt => wt.Layer)
            .ToListAsync();
        return Results.Ok(weeklyTargets);
    }


    private static async Task<IResult> GetWeeklyTargetsByProductRoleAndWeek(
        [FromServices] ApplicationDbContext db,
        int productId,
        ProductionRole productionRole,
        [FromQuery] string date)
    {
        if (!DateTime.TryParse(date, out DateTime parsedDate))
        {
            return Results.BadRequest("Invalid date format");
        }

        var weekStart = GetStartOfWeek(parsedDate);
        var weekEnd = weekStart.AddDays(7);

        var weeklyTargets = await db.WeeklyTargets
            .Include(wt => wt.Product)
            .Include(wt => wt.Layer)
            .Where(wt => wt.ProductId == productId &&
                         wt.ProductionRole == productionRole &&
                         wt.WeekStart >= weekStart &&
                         wt.WeekStart < weekEnd)
            .ToListAsync();
        return Results.Ok(weeklyTargets);
    }

    private static async Task<IResult> CreateOrUpdateWeeklyTarget(
        [FromServices] ApplicationDbContext db,
        [FromBody] WeeklyTarget weeklyTarget)
    {
        // Normalize the week start date
        weeklyTarget.WeekStart = GetStartOfWeek(weeklyTarget.WeekStart);
        weeklyTarget.Amount = CalculateTotalAmount(weeklyTarget);

        // Check if a weekly target already exists for this combination
        var existingTarget = await db.WeeklyTargets
            .Include(wt => wt.Layer)
            .Include(wt => wt.Product)
            .FirstOrDefaultAsync(wt =>
                wt.ProductId == weeklyTarget.ProductId &&
                wt.LayerId == weeklyTarget.LayerId &&
                wt.ProductionRole == weeklyTarget.ProductionRole &&
                wt.WeekStart == weeklyTarget.WeekStart);

        if (existingTarget != null)
        {
            // Update existing target
            UpdateExistingTarget(existingTarget, weeklyTarget);
            await db.SaveChangesAsync();
            return Results.Ok(existingTarget);
        }
        else
        {
            // Verify that the Layer and Product exist
            var layer = await db.Layers.FindAsync(weeklyTarget.LayerId);
            var product = await db.Products.FindAsync(weeklyTarget.ProductId);

            if (layer == null || product == null)
            {
                return Results.BadRequest("Invalid Layer or Product ID");
            }

            // Create new weekly target
            var newTarget = new WeeklyTarget
            {
                ProductionRole = weeklyTarget.ProductionRole,
                ProductId = weeklyTarget.ProductId,
                LayerId = weeklyTarget.LayerId,
                WeekStart = weeklyTarget.WeekStart,
                MondayAmount = weeklyTarget.MondayAmount,
                TuesdayAmount = weeklyTarget.TuesdayAmount,
                WednesdayAmount = weeklyTarget.WednesdayAmount,
                ThursdayAmount = weeklyTarget.ThursdayAmount,
                FridayAmount = weeklyTarget.FridayAmount,
                SaturdayAmount = weeklyTarget.SaturdayAmount,
                SundayAmount = weeklyTarget.SundayAmount,
                Amount = weeklyTarget.Amount
            };

            db.WeeklyTargets.Add(newTarget);
            await db.SaveChangesAsync();
            return Results.Created($"/api/weekly-targets/{newTarget.Id}", newTarget);
        }
    }

    private static void UpdateExistingTarget(WeeklyTarget existingTarget, WeeklyTarget updatedTarget)
    {
        existingTarget.MondayAmount = updatedTarget.MondayAmount;
        existingTarget.TuesdayAmount = updatedTarget.TuesdayAmount;
        existingTarget.WednesdayAmount = updatedTarget.WednesdayAmount;
        existingTarget.ThursdayAmount = updatedTarget.ThursdayAmount;
        existingTarget.FridayAmount = updatedTarget.FridayAmount;
        existingTarget.SaturdayAmount = updatedTarget.SaturdayAmount;
        existingTarget.SundayAmount = updatedTarget.SundayAmount;
        existingTarget.Amount = updatedTarget.Amount;
    }

    private static async Task<IResult> GetDailyTargets(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger,
        [FromQuery] string date,
        [FromQuery] ProductionRole productionRole) // Added productionRole as a query parameter
    {
        if (!DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDate))
        {
            return Results.BadRequest("Invalid date format");
        }

        var weekStart = GetStartOfWeek(parsedDate);
        var dayOfWeek = parsedDate.DayOfWeek;
        logger.LogInformation("week start: {weekStart}", weekStart);
        logger.LogInformation("date: {parsedDate}", parsedDate);
        logger.LogInformation("day: {dayOfWeek}", dayOfWeek);
        logger.LogInformation("production role: {productionRole}", productionRole); // Log the productionRole

        // Modify query to filter by productionRole
        var weeklyTargets = await db.WeeklyTargets
            .Include(wt => wt.Product)
            .Include(wt => wt.Layer)
            .Where(wt => wt.WeekStart == weekStart && wt.ProductionRole == productionRole) // Add filtering by ProductionRole
            .ToListAsync();

        var dailyTargets = weeklyTargets.Select(wt => new
        {
            TargetId = wt.Id,
            wt.LayerId,
            Layer = wt.Layer,
            wt.ProductId,
            Product = wt.Product,
            Amount = GetDailyAmount(wt, dayOfWeek),
            Date = parsedDate.ToString("yyyy-MM-dd")
        }).ToList();

        return Results.Ok(dailyTargets);
    }

    private static DateTime GetStartOfWeek(DateTime date)
    {
        int diff = (7 + (date.DayOfWeek - DayOfWeek.Sunday)) % 7;
        return date.Date.AddDays(-1 * diff).Date;
    }

    private static decimal CalculateTotalAmount(WeeklyTarget wt)
    {
        return (wt.MondayAmount ?? 0) + (wt.TuesdayAmount ?? 0) + (wt.WednesdayAmount ?? 0) +
               (wt.ThursdayAmount ?? 0) + (wt.FridayAmount ?? 0) + (wt.SaturdayAmount ?? 0) +
               (wt.SundayAmount ?? 0);
    }


    private static void UpdateDailyAmountForTarget(WeeklyTarget weeklyTarget, DailyAmountUpdate update)
    {
        switch (update.DayOfWeek.ToLower())
        {
            case "monday": weeklyTarget.MondayAmount = update.Amount; break;
            case "tuesday": weeklyTarget.TuesdayAmount = update.Amount; break;
            case "wednesday": weeklyTarget.WednesdayAmount = update.Amount; break;
            case "thursday": weeklyTarget.ThursdayAmount = update.Amount; break;
            case "friday": weeklyTarget.FridayAmount = update.Amount; break;
            case "saturday": weeklyTarget.SaturdayAmount = update.Amount; break;
            case "sunday": weeklyTarget.SundayAmount = update.Amount; break;
            default: throw new ArgumentException("Invalid day of week");
        }
    }

    private static decimal? GetDailyAmount(WeeklyTarget wt, DayOfWeek dayOfWeek)
    {
        return dayOfWeek switch
        {
            DayOfWeek.Sunday => wt.SundayAmount,
            DayOfWeek.Monday => wt.MondayAmount,
            DayOfWeek.Tuesday => wt.TuesdayAmount,
            DayOfWeek.Wednesday => wt.WednesdayAmount,
            DayOfWeek.Thursday => wt.ThursdayAmount,
            DayOfWeek.Friday => wt.FridayAmount,
            DayOfWeek.Saturday => wt.SaturdayAmount,
            _ => null
        };
    }
}

public class DailyAmountUpdate
{
    public string DayOfWeek { get; set; }
    public decimal? Amount { get; set; }
}