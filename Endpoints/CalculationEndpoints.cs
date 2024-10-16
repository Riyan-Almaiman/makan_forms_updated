using forms_api.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public static class CalculationEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/calculations", GetAllCalculations)
            .WithName("GetAllCalculations");

        app.MapGet("/api/calculations/{id}", GetCalculationById)
            .WithName("GetCalculationById");

        app.MapPost("/api/calculations", CreateCalculation)
            .WithName("CreateCalculation");

        app.MapPut("/api/calculations/{id}", UpdateCalculation)
            .WithName("UpdateCalculation");

        app.MapDelete("/api/calculations/{id}", DeleteCalculation)
            .WithName("DeleteCalculation");
    }

    private static async Task<IResult> GetAllCalculations(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching all calculations");
        var calculations = await db.Calculations
            .Include(c => c.Layer)
            .Include(c => c.Remark)
            .Include(c => c.Product)
            .ToListAsync();
        return Results.Ok(calculations);
    }

    private static async Task<IResult> GetCalculationById(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching calculation with ID: {CalculationId}", id);
        var calculation = await db.Calculations
            .Include(c => c.Layer)
            .Include(c => c.Remark)
            .Include(c => c.Product)
            .FirstOrDefaultAsync(c => c.CalculationId == id);
        return calculation is null ? Results.NotFound() : Results.Ok(calculation);
    }

    private static async Task<IResult> CreateCalculation(
        [FromBody] Calculation calculation,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Creating new calculation");
        logger.LogInformation("Received calculation data: {@Calculation}", calculation.Layer.Id);

        var errorMessages = new List<string>();

        var layer = await db.Layers.FindAsync(calculation.Layer.Id);
        if (layer == null)
        {
            errorMessages.Add($"Layer with ID {calculation.Layer.Id} does not exist.");
        }

        var remark = await db.Remarks.FindAsync(calculation.Remark.Id);
        if (remark == null)
        {
            errorMessages.Add($"Remark with ID {calculation.Remark.Id} does not exist.");
        }

        var product = await db.Products.FindAsync(calculation.Product.Id);
        if (product == null)
        {
            errorMessages.Add($"Product with ID {calculation.Product.Id} does not exist.");
        }

        if (errorMessages.Any())
        {
            return Results.BadRequest(new { Errors = errorMessages });
        }

        calculation.Layer = layer;
        calculation.Remark = remark;
        calculation.Product = product;
        calculation.ValuePerHour = Math.Round(calculation.ValuePer8Hours / calculation.DailyHours, 2);

        db.Calculations.Add(calculation);
        await db.SaveChangesAsync();
        return Results.Created($"/api/calculations/{calculation.CalculationId}", calculation);
    }

    private static async Task<IResult> UpdateCalculation(
        [FromRoute] int id,
        [FromBody] Calculation updatedCalculation,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Updating calculation with ID: {CalculationId}", id);
        var calculation = await db.Calculations.FindAsync(id);
        if (calculation is null) return Results.NotFound();

        var layer = await db.Layers.FindAsync(updatedCalculation.LayerId);
        var remark = await db.Remarks.FindAsync(updatedCalculation.RemarkId);
        var product = await db.Products.FindAsync(updatedCalculation.ProductId);

        if (layer == null || remark == null || product == null)
        {
            return Results.BadRequest("One or more referenced entities do not exist.");
        }

        calculation.Layer = layer;
        calculation.Remark = remark;
        calculation.ValuePerHour = Math.Round(updatedCalculation.ValuePer8Hours / updatedCalculation.DailyHours, 2);
        calculation.ValuePer8Hours = updatedCalculation.ValuePer8Hours;
        calculation.Product = product;

        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteCalculation(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Deleting calculation with ID: {CalculationId}", id);
        var calculation = await db.Calculations.FindAsync(id);
        if (calculation is null) return Results.NotFound();

        db.Calculations.Remove(calculation);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
}