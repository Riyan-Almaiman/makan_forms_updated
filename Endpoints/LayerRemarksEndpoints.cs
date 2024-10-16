using forms_api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public static class LayerRemarkEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        // Layer Endpoints
        app.MapGet("/api/layers", GetAllLayers)
            .WithName("GetAllLayers")
            .RequireAuthorization();

        app.MapGet("/api/layers/{id}", GetLayerById)
            .WithName("GetLayerById")
            .RequireAuthorization();

        app.MapPost("/api/layers", CreateLayer)
            .WithName("CreateLayer")
            .RequireAuthorization();

        app.MapPut("/api/layers/{id}", UpdateLayer)
            .WithName("UpdateLayer")
            .RequireAuthorization();

        app.MapDelete("/api/layers/{id}", DeleteLayer)
            .WithName("DeleteLayer")
            .RequireAuthorization();

        // Remark Endpoints
        app.MapGet("/api/remarks", GetAllRemarks)
            .WithName("GetAllRemarks")
            .RequireAuthorization();

        app.MapGet("/api/remarks/{id}", GetRemarkById)
            .WithName("GetRemarkById")
            .RequireAuthorization();

        app.MapPost("/api/remarks", CreateRemark)
            .WithName("CreateRemark")
            .RequireAuthorization();

        app.MapPut("/api/remarks/{id}", UpdateRemark)
            .WithName("UpdateRemark")
            .RequireAuthorization();

        app.MapDelete("/api/remarks/{id}", DeleteRemark)
            .WithName("DeleteRemark")
            .RequireAuthorization();

        // Product Endpoints
        app.MapGet("/api/products", GetAllProducts)
            .WithName("GetAllProducts")
            .RequireAuthorization();

        app.MapGet("/api/products/{id}", GetProductById)
            .WithName("GetProductById")
            .RequireAuthorization();

        app.MapPost("/api/products", CreateProduct)
            .WithName("CreateProduct")
            .RequireAuthorization();

        app.MapPut("/api/products/{id}", UpdateProduct)
            .WithName("UpdateProduct")
            .RequireAuthorization();

        app.MapDelete("/api/products/{id}", DeleteProduct)
            .WithName("DeleteProduct")
            .RequireAuthorization();
    }

    // Layer Methods
    private static async Task<IResult> GetAllLayers(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching all layers");
        var layers = await db.Layers.ToListAsync();
        return Results.Ok(layers);
    }

    private static async Task<IResult> GetLayerById(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching layer with ID: {LayerId}", id);
        var layer = await db.Layers.FindAsync(id);
        return layer is null ? Results.NotFound() : Results.Ok(layer);
    }

    private static async Task<IResult> CreateLayer(
        [FromBody] Layer layer,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Creating new layer: {LayerName}", layer.Name);
        db.Layers.Add(layer);
        await db.SaveChangesAsync();
        return Results.Created($"/api/layers/{layer.Id}", layer);
    }

    private static async Task<IResult> UpdateLayer(
        [FromRoute] int id,
        [FromBody] Layer layer,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Updating layer with ID: {LayerId}", id);
        if (id != layer.Id) return Results.BadRequest();
        db.Entry(layer).State = EntityState.Modified;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteLayer(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Deleting layer with ID: {LayerId}", id);
        var layer = await db.Layers.FindAsync(id);
        if (layer is null) return Results.NotFound();
        db.Layers.Remove(layer);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    // Remark Methods
    private static async Task<IResult> GetAllRemarks(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching all remarks");
        var remarks = await db.Remarks.ToListAsync();
        return Results.Ok(remarks);
    }

    private static async Task<IResult> GetRemarkById(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching remark with ID: {RemarkId}", id);
        var remark = await db.Remarks.FindAsync(id);
        return remark is null ? Results.NotFound() : Results.Ok(remark);
    }

    private static async Task<IResult> CreateRemark(
        [FromBody] Remark remark,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Creating new remark: {RemarkName}", remark.Name);
        db.Remarks.Add(remark);
        await db.SaveChangesAsync();
        return Results.Created($"/api/remarks/{remark.Id}", remark);
    }

    private static async Task<IResult> UpdateRemark(
        [FromRoute] int id,
        [FromBody] Remark remark,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Updating remark with ID: {RemarkId}", id);
        if (id != remark.Id) return Results.BadRequest();
        db.Entry(remark).State = EntityState.Modified;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteRemark(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Deleting remark with ID: {RemarkId}", id);
        var remark = await db.Remarks.FindAsync(id);
        if (remark is null) return Results.NotFound();
        db.Remarks.Remove(remark);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    // Product Methods
    private static async Task<IResult> GetAllProducts(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching all products");
        var products = await db.Products.ToListAsync();
        return Results.Ok(products);
    }

    private static async Task<IResult> GetProductById(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching product with ID: {ProductId}", id);
        var product = await db.Products.FindAsync(id);
        return product is null ? Results.NotFound() : Results.Ok(product);
    }

    private static async Task<IResult> CreateProduct(
        [FromBody] Product product,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Creating new product: {ProductName}", product.Name);
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return Results.Created($"/api/products/{product.Id}", product);
    }

    private static async Task<IResult> UpdateProduct(
        [FromRoute] int id,
        [FromBody] Product product,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Updating product with ID: {ProductId}", id);
        if (id != product.Id) return Results.BadRequest();
        db.Entry(product).State = EntityState.Modified;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteProduct(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Deleting product with ID: {ProductId}", id);
        var product = await db.Products.FindAsync(id);
        if (product is null) return Results.NotFound();
        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
}