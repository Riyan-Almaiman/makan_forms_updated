using forms_api.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static forms_api.Entities.SheetEntities;

public static class SheetLayerEndpoints
{
    public class SheetLayerStatusUpdateDto
    {
        public decimal? Completion { get; set; }
        public bool? InProgress { get; set; }
        public bool? IsQCInProgress { get; set; }
        public bool? IsFinalizedQCInProgress { get; set; }
        public bool? IsFinalQCInProgress { get; set; }
    }
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/sheetlayerstatus/search", SearchSheetLayerStatuses)
            .WithName("SearchSheetLayerStatuses");
        app.MapGet("/api/sheetlayerstatus/completed", GetCompletedSheetLayerStatuses)
            .WithName("GetCompletedSheetLayerStatuses");
        app.MapPut("/api/sheetlayerstatus/{id}", UpdateSheetLayerStatus)
            .WithName("UpdateSheetLayerStatus");
        app.MapGet("/api/sheetlayerstatus/searchacrosslayers", SearchSheetLayerStatusesAcrossLayers)
         .WithName("SearchSheetLayerStatusesAcrossLayers");
    }
    private static async Task<IResult> SearchSheetLayerStatusesAcrossLayers(
       [FromQuery] string searchTerm,
       [FromQuery] int? productId,
       [FromServices] ApplicationDbContext db,
       [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Searching sheet layer statuses across layers with term: {SearchTerm} and product: {ProductId}", searchTerm, productId);
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return Results.BadRequest("Search term is required");
        }
        var query = db.SheetLayerStatus
            .Include(sls => sls.Sheet)
            .Include(sls => sls.Layer)
            .Where(sls => sls.Sheet.SheetName.Contains(searchTerm));
        if (productId.HasValue)
        {
            query = query.Where(sls => sls.ProductId == productId.Value);
        }
        var allMatchingStatuses = await query.ToListAsync();
        var sheetLayerStatusIds = allMatchingStatuses.Select(sls => sls.Id).ToList();
        var dailyTargets = await db.DailyTargets
            .Where(dt => sheetLayerStatusIds.Contains(dt.SheetLayerStatusId.Value))
            .Include(dt => dt.Form)
            .ToListAsync();
        var results = allMatchingStatuses
            .GroupBy(sls => sls.LayerId)
            .Select(g => g.OrderByDescending(sls => sls.Sheet.SheetName.StartsWith(searchTerm))
                          .ThenBy(sls => sls.Sheet.SheetName)
                          .First())
            .Select(sls => new
            {
                SheetLayerStatus = sls,
                Sheet = sls.Sheet,
                Layer = sls.Layer,
                DailyTargets = dailyTargets
                    .Where(dt => dt.SheetLayerStatusId == sls.Id)
                    .OrderByDescending(dt => dt.Form.ProductivityDate)
                    .Select(dt => new
                    {
                        ProductionRole = dt.Form.ProductionRole.ToString(),
                        EmployeeName = dt.Form.EmployeeName,
                        TaqniaID = dt.Form.TaqniaID,
                        ProductivityDate = dt.Form.ProductivityDate
                    })
                    .ToList()
            })
            .ToList();
        return Results.Ok(results);
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
    private static async Task<IResult> UpdateSheetLayerStatus(
    [FromRoute] int id,
    [FromBody] SheetLayerStatusUpdateDto updateDto,
    [FromServices] ApplicationDbContext db,
    [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Updating sheet layer status with ID: {Id}", id);

        var sheetLayerStatus = await db.SheetLayerStatus.FindAsync(id);

        if (sheetLayerStatus == null)
        {
            return Results.NotFound($"SheetLayerStatus with ID {id} not found.");
        }

        // Update properties if they are provided in the DTO
        if (updateDto.Completion.HasValue)
            sheetLayerStatus.Completion = updateDto.Completion.Value;
        if (updateDto.InProgress.HasValue)
            sheetLayerStatus.InProgress = updateDto.InProgress.Value;
        if (updateDto.IsQCInProgress.HasValue)
            sheetLayerStatus.IsQCInProgress = updateDto.IsQCInProgress.Value;
        if (updateDto.IsFinalizedQCInProgress.HasValue)
            sheetLayerStatus.IsFinalizedQCInProgress = updateDto.IsFinalizedQCInProgress.Value;
        if (updateDto.IsFinalQCInProgress.HasValue)
            sheetLayerStatus.IsFinalQCInProgress = updateDto.IsFinalQCInProgress.Value;

        try
        {
            await db.SaveChangesAsync();
            return Results.Ok(sheetLayerStatus);
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(ex, "Error updating SheetLayerStatus with ID: {Id}", id);
            return Results.Problem("An error occurred while updating the SheetLayerStatus.");
        }
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

            default:
                return Results.BadRequest("Invalid QC role");
        }

        var sheetLayerStatuses = await query.ToListAsync();
        return Results.Ok(sheetLayerStatuses);
    }
}