using forms_api.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static forms_api.Entities.SheetEntities;

public static class SheetsEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/sheets", GetAllSheets)
            .WithName("GetAllSheets");

        app.MapGet("/api/sheets/search", SearchSheets)
            .WithName("SearchSheets");

        app.MapGet("/api/sheets/{id}", GetSheetById)
            .WithName("GetSheetById");

        app.MapGet("/api/sheets/delivery/{deliveryNumber}", GetSheetsByDeliveryNumber)
            .WithName("GetSheetsByDeliveryNumber");

        app.MapGet("/api/sheets/inprogress/{status}", GetSheetsByProgress)
            .WithName("GetSheetsByProgress");

        app.MapPost("/api/sheets", CreateSheet)
            .WithName("CreateSheet");

        app.MapPut("/api/sheets/{id}", UpdateSheet)
            .WithName("UpdateSheet");

        app.MapDelete("/api/sheets/{id}", DeleteSheet)
            .WithName("DeleteSheet");
    }

    private static async Task<IResult> GetAllSheets(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        var sheets = await db.Sheets.ToListAsync();
        logger.LogInformation("Fetching all sheets");
        return Results.Ok(sheets);
    }

    private static async Task<IResult> SearchSheets(
        [FromQuery] string searchTerm,

        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger,
                [FromQuery] int limit = 20
)

    {
        logger.LogInformation("Searching sheets with term: {SearchTerm}", searchTerm);

        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return Results.BadRequest("Search term is required");
        }

        var sheets = await db.Sheets
            .Where(s => s.SheetName.Contains(searchTerm)
                     || s.SheetId.ToString().Contains(searchTerm)
                     || s.Country.Contains(searchTerm))
            .Take(limit)
            .ToListAsync();

        return Results.Ok(sheets);
    }

    private static async Task<IResult> GetSheetById(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching sheet with ID: {SheetId}", id);
        var sheet = await db.Sheets.FirstOrDefaultAsync(s => s.SheetId == id);
        return sheet is null ? Results.NotFound() : Results.Ok(sheet);
    }

    private static async Task<IResult> GetSheetsByDeliveryNumber(
        [FromRoute] int deliveryNumber,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching sheets with delivery number: {DeliveryNumber}", deliveryNumber);
        var sheets = await db.Sheets
            .Where(s => s.DeliveryNumber == deliveryNumber)
            .ToListAsync();
        return sheets.Count == 0 ? Results.NotFound("No sheets found with the specified delivery number") : Results.Ok(sheets);
    }

    private static async Task<IResult> GetSheetsByProgress(
        [FromRoute] bool status,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching sheets with InProgress status: {Status}", status);
        var sheets = await db.Sheets
            .Where(s => s.InProgress == status)
            .ToListAsync();
        return sheets.Count == 0 ? Results.NotFound("No sheets found with the specified progress status") : Results.Ok(sheets);
    }

    private static async Task<IResult> CreateSheet(
        [FromBody] Sheet sheet,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Creating new sheet");

        db.Sheets.Add(sheet);
        await db.SaveChangesAsync();
        return Results.Created($"/api/sheets/{sheet.SheetId}", sheet);
    }

    private static async Task<IResult> UpdateSheet(
        [FromRoute] int id,
        [FromBody] Sheet updatedSheet,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Updating sheet with ID: {SheetId}", id);
        var sheet = await db.Sheets.FindAsync(id);
        if (sheet is null) return Results.NotFound();

        sheet.SheetName = updatedSheet.SheetName;
        sheet.DeliveryNumber = updatedSheet.DeliveryNumber;
        sheet.InProgress = updatedSheet.InProgress;
        sheet.Hydrography = updatedSheet.Hydrography;
        sheet.Agriculture = updatedSheet.Agriculture;
        sheet.Buildings = updatedSheet.Buildings;
        sheet.Roads = updatedSheet.Roads;

        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteSheet(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Deleting sheet with ID: {SheetId}", id);
        var sheet = await db.Sheets.FindAsync(id);
        if (sheet is null) return Results.NotFound();

        db.Sheets.Remove(sheet);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
}