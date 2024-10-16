using forms_api.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static forms_api.Entities.SheetEntities;

public static class SheetLayerEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/sheetlayerstatus/search", SearchSheetLayerStatuses)
            .WithName("SearchSheetLayerStatuses");
        app.MapGet("/api/sheetlayerstatus/completed", GetCompletedSheetLayerStatuses)
            .WithName("GetCompletedSheetLayerStatuses");
    }

    private static async Task<IResult> SearchSheetLayerStatuses(
        [FromQuery] string searchTerm,
        [FromQuery] int layerId,
        [FromQuery] int? productId,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger,
        [FromQuery] int limit = 20)
    {
        logger.LogInformation("Searching sheet layer statuses with term: {SearchTerm} for layer: {LayerId} and product: {ProductId}", searchTerm, layerId, productId);
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return Results.BadRequest("Search term is required");
        }

        var query = db.SheetLayerStatus
            .Include(sls => sls.Sheet)
            .Include(sls => sls.Layer)
            .Where(sls =>
                sls.LayerId == layerId &&
                sls.Sheet.SheetName.Contains(searchTerm));

        if (productId.HasValue)
        {
            query = query.Where(sls => sls.ProductId == productId.Value);
        }

        var sheetLayerStatuses = await query
            .Take(limit)
            .ToListAsync();

        return Results.Ok(sheetLayerStatuses);
    }

    private static async Task<IResult> GetCompletedSheetLayerStatuses(
       [FromQuery] int layerId,
       [FromQuery] int? productId,
       [FromQuery] ProductionRole role,
       [FromServices] ApplicationDbContext db,
       [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching sheet layer statuses for layer: {LayerId}, product: {ProductId}, and role: {Role}", layerId, productId, role);

        var query = db.SheetLayerStatus
            .Include(sls => sls.Sheet)
            .Include(sls => sls.Layer)
            .Where(sls => sls.LayerId == layerId);

        if (productId.HasValue)
        {
            query = query.Where(sls => sls.ProductId == productId.Value);
        }

        switch (role)
        {
            case ProductionRole.DailyQC:
                query = query.Where(sls =>
                    (sls.Completion == 1 || !sls.InProgress) &&
                    sls.IsQCInProgress);
                break;
            case ProductionRole.FinalizedQC:
                query = query.Where(sls =>
                    !sls.IsQCInProgress &&
                    sls.IsFinalizedQCInProgress);
                break;
            case ProductionRole.FinalQC:
                query = query.Where(sls =>
                    !sls.IsFinalizedQCInProgress &&
                    sls.IsFinalQCInProgress);
                break;
            default:
                return Results.BadRequest("Invalid QC role");
        }

        var sheetLayerStatuses = await query.ToListAsync();
        return Results.Ok(sheetLayerStatuses);
    }
}