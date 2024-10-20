using forms_api.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public static class ApprovalEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/approvals", GetAllApprovals)
            .WithName("GetAllApprovals");

        app.MapGet("/api/approvals/{id}", GetApprovalById)
            .WithName("GetApprovalById");

        app.MapPost("/api/approvals", CreateApproval)
            .WithName("CreateApproval");

        app.MapPut("/api/approvals/update", UpdateApproval)
            .WithName("UpdateApproval");

        app.MapDelete("/api/approvals/{id}", DeleteApproval)
            .WithName("DeleteApproval");

        app.MapGet("/api/approvals/supervisor/{taqniaId}", GetApprovalsBySupervisor)
            .WithName("GetApprovalsBySupervisor");

        app.MapGet("/api/approvals/pending", GetPendingApprovals)
            .WithName("GetPendingApprovals");
    }

    private static async Task<IResult> GetAllApprovals(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching all approvals");
        var approvals = await db.Approvals.ToListAsync();
        return Results.Ok(approvals);
    }

    private static async Task<IResult> GetApprovalById(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching approval with ID: {ApprovalId}", id);
        var approval = await db.Approvals.FindAsync(id);
        return approval is null ? Results.NotFound() : Results.Ok(approval);
    }

    private static async Task<IResult> CreateApproval(
        [FromBody] Approval approval,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Creating new approval for form: {FormId}", approval.FormId);
        db.Approvals.Add(approval);
        await db.SaveChangesAsync();
        return Results.Created($"/api/approvals/{approval.ApprovalId}", approval);
    }

    private static async Task<IResult> UpdateApproval(
        [FromBody] ApprovalUpdateRequest request,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Updating approval for form: {FormId}", request.FormId);
        var form = await db.Forms
            .Include(f => f.Approvals)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
            .FirstOrDefaultAsync(f => f.FormId == request.FormId);

        if (form == null)
        {
            return Results.NotFound($"Form with ID {request.FormId} not found");
        }

        var approval = form.Approvals.FirstOrDefault();
        if (approval == null)
        {
            approval = new Approval { FormId = request.FormId };
            form.Approvals.Add(approval);
        }

        // Update approval status
        approval.State = request.IsApproved ? FormState.approved : FormState.rejected;
        approval.SupervisorComment = request.Comment;
        if (form.ProductionRole == ProductionRole.Production)
        {
            // Update SheetLayerStatuses
            foreach (var dailyTarget in form.DailyTargets)
            {
                if (dailyTarget.SheetLayerStatus != null)
                {
                    if (request.IsApproved)
                    {
                        // Update completion
                        dailyTarget.SheetLayerStatus.Completion += (decimal)dailyTarget.Productivity;

                        // Ensure completion doesn't exceed 1 (100%)
                        if (dailyTarget.SheetLayerStatus.Completion > 1)
                        {
                            dailyTarget.SheetLayerStatus.Completion = 1;
                        }

                        // Update InProgress status
                        if (dailyTarget.SheetLayerStatus.Completion >= 1)
                        {
                            dailyTarget.SheetLayerStatus.InProgress = false;
                        }
                    }
                    else
                    {
                        // If not approved, ensure it's still in progress
                        dailyTarget.SheetLayerStatus.InProgress = true;
                        if(dailyTarget.SheetLayerStatus.Completion == 1){
                            dailyTarget.SheetLayerStatus.Completion -= (decimal)dailyTarget.Productivity;
                        }
                    }
                }

                // Handle old forms with SheetAssignments (optional)
                if (dailyTarget.SheetAssignment != null)
                {
                    // You can choose to do nothing, or perhaps log a warning
                    logger.LogWarning("Outdated SheetAssignment found for DailyTarget ID: {DailyTargetId}", dailyTarget.TargetId);
                }
            }
        }
        else if (form.ProductionRole == ProductionRole.DailyQC)
        {
            if (request.IsApproved)
            {
                foreach (var dailyTarget in form.DailyTargets)
                {
                    dailyTarget.SheetLayerStatus.IsQCInProgress = false; 
                }
            }
            if (!request.IsApproved)
            {
                foreach (var dailyTarget in form.DailyTargets)
                {
                    dailyTarget.SheetLayerStatus.IsQCInProgress = true;
                }
            }
        }
        //else if (form.ProductionRole == ProductionRole.FinalizedQC)
        //{
        //    if (request.IsApproved)
        //    {
        //        foreach (var dailyTarget in form.DailyTargets)
        //        {
        //            dailyTarget.SheetLayerStatus.IsFinalizedQCInProgress = false;

        //        }
        //    }
        //    if (!request.IsApproved)
        //    {
        //        foreach (var dailyTarget in form.DailyTargets)
        //        {
        //            dailyTarget.SheetLayerStatus.IsFinalizedQCInProgress = true;
        //        }
        //    }
        //}
        //else if (form.ProductionRole == ProductionRole.FinalQC)
        //{
        //    if (request.IsApproved)
        //    {
        //        foreach (var dailyTarget in form.DailyTargets)
        //        {
        //            dailyTarget.SheetLayerStatus.IsFinalQCInProgress = false;
        //        }
        //    }
        //    if (!request.IsApproved)
        //    {
        //        foreach (var dailyTarget in form.DailyTargets)
        //        {
        //            dailyTarget.SheetLayerStatus.IsFinalQCInProgress = false;
        //        }
        //    }
        //}
        try
        {
            await db.SaveChangesAsync();
            logger.LogInformation("Successfully updated approval and SheetLayerStatuses for form: {FormId}", request.FormId);
            return Results.NoContent();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while updating approval and SheetLayerStatuses for form: {FormId}", request.FormId);
            return Results.StatusCode(500);
        }
    }
    public class ApprovalUpdateRequest
    {
        public int FormId { get; set; }
        public bool IsApproved { get; set; }
        public string Comment { get; set; }
    }


    private static async Task<IResult> DeleteApproval(
        [FromRoute] int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Deleting approval with ID: {ApprovalId}", id);
        var approval = await db.Approvals.FindAsync(id);
        if (approval is null) return Results.NotFound();

        db.Approvals.Remove(approval);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> GetApprovalsBySupervisor(
        [FromRoute] int taqniaId,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching approvals for supervisor with TaqniaID: {TaqniaId}", taqniaId);
        var approvals = await db.Approvals
            .Where(a => a.SupervisorTaqniaID == taqniaId)
            .ToListAsync();
        return Results.Ok(approvals);
    }

    private static async Task<IResult> GetPendingApprovals(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching pending approvals");
        var pendingApprovals = await db.Approvals
            .Where(a => a.State == FormState.pending)
            .ToListAsync();
        return Results.Ok(pendingApprovals);
    }
}
