using forms_api.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public static class TargetsEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/targets", GetAllTargets)
            .WithName("GetAllTargets");

        app.MapGet("/api/targets/{id}", GetTargetById)
            .WithName("GetTargetById");

        app.MapPost("/api/targets", CreateTarget)
            .WithName("CreateTarget");

        app.MapPut("/api/targets/{id}", UpdateTarget)
            .WithName("UpdateTarget");

        app.MapDelete("/api/targets/{id}", DeleteTarget)
            .WithName("DeleteTarget");
    }

    private static async Task<IResult> GetAllTargets(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        var targets = await db.Targets
            .Include(t => t.Layer)
            .Include(t => t.Product)
            .ToListAsync();
        logger.LogInformation("Fetching all targets");
        return Results.Ok(targets);
    }

    private static async Task<IResult> GetTargetById(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching target with ID: {TargetId}", id);
        var target = await db.Targets
            .Include(t => t.Layer)
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.TargetId == id);
        return target is null ? Results.NotFound() : Results.Ok(target);
    }

    private static async Task<IResult> CreateTarget(
        [FromBody] Targets target,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Creating new target");
        var layer = await db.Layers.FindAsync(target.Layer.Id);
        var product = await db.Products.FindAsync(target.Product.Id);
        if (layer == null || product == null)
        {
            return Results.BadRequest("One or more referenced entities do not exist.");
        }
        target.Layer = layer;
        target.Product = product;
        db.Targets.Add(target);
        await db.SaveChangesAsync();
        return Results.Created($"/api/targets/{target.TargetId}", target);
    }

    private static async Task<IResult> UpdateTarget(
        [FromRoute] int id,
        [FromBody] Targets updatedTarget,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Updating target with ID: {TargetId}", id);
        var target = await db.Targets.FindAsync(id);
        if (target is null) return Results.NotFound();

        var layer = await db.Layers.FindAsync(updatedTarget.Layer.Id);
        var product = await db.Products.FindAsync(updatedTarget.Product.Id);
        if (layer == null || product == null)
        {
            return Results.BadRequest("One or more referenced entities do not exist.");
        }

        target.Layer = layer;
        target.Product = product;
        target.Productivity = updatedTarget.Productivity;
        target.EditorCount = updatedTarget.EditorCount;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteTarget(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Deleting target with ID: {TargetId}", id);
        var target = await db.Targets.FindAsync(id);
        if (target is null) return Results.NotFound();
        db.Targets.Remove(target);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
}