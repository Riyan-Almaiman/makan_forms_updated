using forms_api.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using static forms_api.Entities.SheetEntities;

public static class SheetAssignmentsEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/sheetassignments", GetAllSheetAssignments)
            .WithName("GetAllSheetAssignments");

        app.MapGet("/api/sheetassignments/sheet/{sheetId}", GetSheetAssignmentsBySheetId)
            .WithName("GetSheetAssignmentsBySheetId");

        app.MapGet("/api/sheetassignments/user/{userId}", GetSheetAssignmentsByUserId)
            .WithName("GetSheetAssignmentsByUserId");

        app.MapPost("/api/sheetassignments", CreateSheetAssignment)
            .WithName("CreateSheetAssignment");

        app.MapPut("/api/sheetassignments/{id}", UpdateSheetAssignment)
            .WithName("UpdateSheetAssignment");

        app.MapDelete("/api/sheetassignments/{id}", DeleteSheetAssignment)
            .WithName("DeleteSheetAssignment");
        app.MapPost("/api/sheetassignments/dailysheetassignments", GetDailySheetAssignments)
               .WithName("GetDailySheetAssignments");
    }
    public class DailySheetAssignmentRequest
    {
        public int[] TaqniaIDs { get; set; }
        public string Date { get; set; }
        public int LayerId { get; set; }
    }

    public class SheetAssignmentDto
    {
        public int SheetId { get; set; }
        public int TaqniaID { get; set; }
        public int? LayerId { get; set; }
        public bool InProgress { get; set; }
        public bool IsApproved { get; set; }
        public bool? IsQC { get; set; }
    }
    private static async Task<IResult> GetDailySheetAssignments(
            [FromBody] DailySheetAssignmentRequest request,
            ApplicationDbContext db,
            ILogger<Program> logger)
    {
        logger.LogInformation("Fetching daily sheet assignments for TaqniaIDs: {TaqniaIds} and Date: {Date}",
            string.Join(", ", request.TaqniaIDs), request.Date);

        if (!DateTime.TryParseExact(request.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDate))
        {
            return Results.BadRequest("Invalid date format. Please use yyyy-MM-dd.");
        }

        var assignments = await db.DailySheets
            .Where(dsa => request.TaqniaIDs.Contains(dsa.TaqniaId) && dsa.AssignmentDate == parsedDate && dsa.LayerId == request.LayerId)
            .ToListAsync();

        if (assignments.Count == 0)
        {
            return Results.NotFound($"No daily assignments found for the provided TaqniaIDs on {request.Date}");
        }

        var summary = assignments
            .GroupBy(a => a.TaqniaId)
            .Select(g => new
            {
                TaqniaId = g.Key,
                SheetCount = g.Sum(a => a.Remark.ToLower() == "dense" ? 0.5 : 1.0)
            })
            .ToDictionary(x => x.TaqniaId, x => x.SheetCount);

        return Results.Ok(summary);
    }

    private static async Task<IResult> GetAllSheetAssignments(
        ApplicationDbContext db,
        ILogger<Program> logger)
    {
        logger.LogInformation("Fetching all sheet assignments");
        var assignments = await db.SheetAssignments
            .Include(sa => sa.Sheet)
            .Include(sa => sa.User)
            .Include(sa => sa.Layer)
            .ToListAsync();
        return Results.Ok(assignments);
    }

    private static async Task<IResult> GetSheetAssignmentsBySheetId(
        int sheetId,
        ApplicationDbContext db,
        ILogger<Program> logger)
    {
        logger.LogInformation("Fetching sheet assignments for Sheet ID: {SheetId}", sheetId);
        var assignments = await db.SheetAssignments
            .Where(sa => sa.SheetId == sheetId)
            .Include(sa => sa.User)
            .Include(sa => sa.Layer)
            .ToListAsync();

        return assignments.Count == 0
            ? Results.NotFound($"No assignments found for Sheet ID {sheetId}")
            : Results.Ok(assignments);
    }

    private static async Task<IResult> GetSheetAssignmentsByUserId(
        int userId,
        ApplicationDbContext db,
        ILogger<Program> logger)
    {
        logger.LogInformation("Fetching sheet assignments for User ID: {UserId}", userId);
        var assignments = await db.SheetAssignments
            .Where(sa => sa.TaqniaID == userId)
            .Include(sa => sa.Sheet)
            .Include(sa => sa.Layer)
            .ToListAsync();

        return Results.Ok(assignments);
    }

    private static async Task<IResult> CreateSheetAssignment(
        SheetAssignmentDto assignmentDto,
        ApplicationDbContext db,
        ILogger<Program> logger)
    {
        logger.LogInformation("Creating new sheet assignment");

        var sheetExists = await db.Sheets.AnyAsync(s => s.SheetId == assignmentDto.SheetId);
        var userExists = await db.Users.AnyAsync(u => u.TaqniaID == assignmentDto.TaqniaID);

        if (!sheetExists || !userExists)
        {
            return Results.BadRequest("Invalid SheetId or TaqniaID");
        }

        var existingAssignment = await db.SheetAssignments
            .FirstOrDefaultAsync(sa =>
                sa.SheetId == assignmentDto.SheetId &&
                sa.TaqniaID == assignmentDto.TaqniaID &&
                sa.LayerId == assignmentDto.LayerId);

        if (existingAssignment != null)
        {
            return Results.Conflict("Assignment already exists for this Sheet, User, and Layer");
        }

        var assignment = new SheetAssignment
        {
            SheetId = assignmentDto.SheetId,
            TaqniaID = assignmentDto.TaqniaID,
            LayerId = assignmentDto.LayerId,
            InProgress = assignmentDto.InProgress,
            IsQC = assignmentDto.IsQC,
            AssignmentDate = DateTime.UtcNow
        };

        db.SheetAssignments.Add(assignment);
        await db.SaveChangesAsync();

        return Results.Created($"/api/sheetassignments/{assignment.SheetAssignmentId}", assignment);
    }

    private static async Task<IResult> UpdateSheetAssignment(
         int id,
         SheetAssignmentDto updatedAssignmentDto,
         ApplicationDbContext db,
         ILogger<Program> logger)
    {
        logger.LogInformation("Updating sheet assignment with ID: {Id}", id);

        var assignment = await db.SheetAssignments.FindAsync(id);

        if (assignment == null)
        {
            return Results.NotFound("Assignment not found");
        }

        // Update the properties of the assignment
        assignment.SheetId = updatedAssignmentDto.SheetId;
        assignment.TaqniaID = updatedAssignmentDto.TaqniaID;
        assignment.LayerId = updatedAssignmentDto.LayerId;
        assignment.InProgress = updatedAssignmentDto.InProgress;
        assignment.IsApproved = updatedAssignmentDto.IsApproved;
        assignment.IsQC = updatedAssignmentDto.IsQC;

        try
        {
            await db.SaveChangesAsync();
            logger.LogInformation("Successfully updated SheetAssignment");
            return Results.NoContent();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while updating SheetAssignment");
            return Results.StatusCode(500);
        }
    }

    private static async Task<IResult> DeleteSheetAssignment(
        int id,
        ApplicationDbContext db,
        ILogger<Program> logger)
    {
        logger.LogInformation("Deleting sheet assignment with ID: {Id}", id);

        var assignment = await db.SheetAssignments.FindAsync(id);
        if (assignment == null)
        {
            return Results.NotFound("Assignment not found");
        }

        db.SheetAssignments.Remove(assignment);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
}