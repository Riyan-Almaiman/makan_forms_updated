using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using forms_api.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

public static class LinksEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/links", GetAllLinks)
            .WithName("GetAllLinks");

        app.MapGet("/api/links/week", GetLinksByWeek)
            .WithName("GetLinksByWeek");

        app.MapGet("/api/links/{id}", GetLinkById)
            .WithName("GetLinkById");

        app.MapPost("/api/links", CreateLink)
            .WithName("CreateLink");

        app.MapPut("/api/links/{id}", UpdateLink)
            .WithName("UpdateLink");

        app.MapDelete("/api/links/{id}", DeleteLink)
            .WithName("DeleteLink");
    }

    private static async Task<IResult> GetAllLinks(ApplicationDbContext db)
    {
        var links = await db.Set<Links>()
            .Include(l => l.Layer)
            .ToListAsync();
        return Results.Ok(links);
    }

    private static async Task<IResult> GetLinksByWeek(
        ApplicationDbContext db,
        [FromQuery] string date)
    {
        if (!DateTime.TryParse(date, out DateTime parsedDate))
        {
            return Results.BadRequest("Invalid date format");
        }

        var weekStart = GetStartOfWeek(parsedDate);
        var weekEnd = weekStart.AddDays(7);

        var links = await db.Set<Links>()
            .Include(l => l.Layer)
            .Where(l => l.WeekStart >= weekStart && l.WeekStart < weekEnd)
            .ToListAsync();
        return Results.Ok(links);
    }

    private static async Task<IResult> GetLinkById(
        ApplicationDbContext db,
        int id)
    {
        var link = await db.Set<Links>()
            .Include(l => l.Layer)
            .FirstOrDefaultAsync(l => l.Id == id);
        return link is null ? Results.NotFound() : Results.Ok(link);
    }

    private static async Task<IResult> CreateLink(
        ApplicationDbContext db,
        Links link)
    {
        link.WeekStart = GetStartOfWeek(link.WeekStart);

        var existingLink = await db.Set<Links>()
            .FirstOrDefaultAsync(l => l.LayerId == link.LayerId && l.WeekStart == link.WeekStart);

        if (existingLink != null)
        {
            existingLink.Link = link.Link;
            await db.SaveChangesAsync();
            return Results.Ok(existingLink);
        }
        else
        {
            db.Set<Links>().Add(link);
            await db.SaveChangesAsync();
            return Results.Created($"/api/links/{link.Id}", link);
        }
    }

    private static async Task<IResult> UpdateLink(
        ApplicationDbContext db,
        int id,
        Links updatedLink)
    {
        var link = await db.Set<Links>().FindAsync(id);
        if (link is null) return Results.NotFound();

        updatedLink.WeekStart = GetStartOfWeek(updatedLink.WeekStart);

        var existingLink = await db.Set<Links>()
            .FirstOrDefaultAsync(l => l.LayerId == updatedLink.LayerId && l.WeekStart == updatedLink.WeekStart && l.Id != id);
        if (existingLink != null)
        {
            return Results.BadRequest("A link for this layer and week already exists.");
        }

        link.LayerId = updatedLink.LayerId;
        link.Link = updatedLink.Link;
        link.WeekStart = updatedLink.WeekStart;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteLink(
        ApplicationDbContext db,
        int id)
    {
        var link = await db.Set<Links>().FindAsync(id);
        if (link is null) return Results.NotFound();
        db.Set<Links>().Remove(link);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static DateTime GetStartOfWeek(DateTime date)
    {
        int diff = (7 + (date.DayOfWeek - DayOfWeek.Sunday)) % 7;
        return date.Date.AddDays(-1 * diff).Date;
    }
}