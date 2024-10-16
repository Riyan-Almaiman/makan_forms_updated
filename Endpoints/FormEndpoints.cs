using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using forms_api.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

public static class FormEndpoints
{

    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/forms", GetAllForms)
            .WithName("GetAllForms")
            .RequireAuthorization();

        app.MapGet("/api/forms/{id}", GetFormById)
            .WithName("GetFormById")
            .RequireAuthorization();

        app.MapPost("/api/forms", CreateOrUpdateForm)
            .WithName("CreateOrUpdateForm")
            .RequireAuthorization();

        app.MapGet("/api/forms/AllFormsByDate/{date}", GetFormsByDate)
            .WithName("GetFormsByDate")
            .RequireAuthorization();

        app.MapDelete("/api/forms/{id}", DeleteForm)
            .WithName("DeleteForm")
            .RequireAuthorization(policy => policy.RequireRole("superadmin", "admin"));

        app.MapGet("/api/users/{taqniaId}/forms", GetFormsByUserTaqniaId)
            .WithName("GetFormsByUserTaqniaId")
            .RequireAuthorization();

        app.MapGet("/api/forms/user/{taqniaId}/date/{date}", GetUserFormByDate)
            .WithName("GetUserFormByDate")
            .RequireAuthorization();

        app.MapGet("/api/forms/supervisor/{supervisorTaqniaId}/date/{date}", GetSupervisorFormsByDate)
            .WithName("GetSupervisorFormsByDate")
            .RequireAuthorization(policy => policy.RequireRole("superadmin", "admin", "supervisor"));

        app.MapGet("/api/forms/supervisor/{supervisorTaqniaId}/pending", GetSupervisorPendingForms)
            .WithName("GetSupervisorPendingForms")
            .RequireAuthorization(policy => policy.RequireRole("superadmin", "admin", "supervisor"));

        app.MapGet("/api/forms/editor/{editorTaqniaId}/pending-rejected", GetEditorPendingOrRejectedForms)
            .WithName("GetEditorPendingOrRejectedForms")
            .RequireAuthorization();
    }
    private static async Task<IResult> GetFormsByDate(
    DateTime date,
    [FromServices] ApplicationDbContext db,
    [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching forms for date: {Date}", date);
        var forms = await db.Forms
            .Where(f => f.ProductivityDate.Date == date.Date)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Product)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Layer)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .ToListAsync();
        return forms.Any() ? Results.Ok(forms) : Results.NotFound();
    }

    private static async Task<IResult> GetSupervisorPendingForms(
        int supervisorTaqniaId,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching pending forms for supervisor with TaqniaID: {SupervisorTaqniaId}", supervisorTaqniaId);
        var pendingForms = await db.Forms
            .Where(f => f.SupervisorTaqniaID == supervisorTaqniaId && f.Approvals.Any(a => a.State == FormState.pending || a.State == FormState.rejected))
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Product)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Layer)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .ToListAsync();
        return pendingForms.Any() ? Results.Ok(pendingForms) : Results.NotFound();
    }

    private static async Task<IResult> GetEditorPendingOrRejectedForms(
        int editorTaqniaId,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching pending or rejected forms for editor with TaqniaID: {EditorTaqniaId}", editorTaqniaId);
        var pendingOrRejectedForms = await db.Forms
            .Where(f => f.TaqniaID == editorTaqniaId &&
                        f.Approvals.Any(a => a.State == FormState.pending || a.State == FormState.rejected))
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Product)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Layer)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .ToListAsync();
        return pendingOrRejectedForms.Any() ? Results.Ok(pendingOrRejectedForms) : Results.NotFound();
    }

    private static async Task<IResult> GetFormsByUserTaqniaId(
        int taqniaId,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching forms for user with TaqniaID: {TaqniaId}", taqniaId);
        var forms = await db.Forms
            .Where(f => f.TaqniaID == taqniaId)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Product)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Layer)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .ToListAsync();
        return Results.Ok(forms);
    }
    private static async Task<IResult> GetAllForms(
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching all forms");
        var forms = await db.Forms
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Product)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Layer)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .ToListAsync();

        return Results.Ok(forms);
    }
    private static async Task<IResult> GetFormById(
          int id,
          [FromServices] ApplicationDbContext db,
          [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching form with ID: {FormId}", id);
        var form = await db.Forms
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Product)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .FirstOrDefaultAsync(f => f.FormId == id);
        return form is null ? Results.NotFound() : Results.Ok(form);
    }

    private static async Task<IResult> CreateOrUpdateForm(
        Form formData,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Processing form submission for user with TaqniaID: {TaqniaId} for date: {Date}", formData.TaqniaID, formData.ProductivityDate);
        var existingForm = await db.Forms
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Layer)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .FirstOrDefaultAsync(f => f.TaqniaID == formData.TaqniaID && f.ProductivityDate.Date == formData.ProductivityDate.Date);

        if (existingForm != null)
        {
            return await FormHandler.HandleExistingForm(formData, existingForm, db, logger);
        }
        else
        {
            return await FormHandler.HandleNewForm(formData, db, logger);
        }
    }




    private static async Task<IResult> DeleteForm(
        int id,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Deleting form with ID: {FormId}", id);
        var form = await db.Forms.FindAsync(id);
        if (form is null) return Results.NotFound();

        db.Forms.Remove(form);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }


    private static async Task<IResult> GetUserFormByDate(
        int taqniaId,
        DateTime date,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching form for user with TaqniaID: {TaqniaId} for date: {Date}", taqniaId, date);
        var form = await db.Forms
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Product)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Layer)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .FirstOrDefaultAsync(f => f.TaqniaID == taqniaId && f.ProductivityDate.Date == date.Date);

        return form is null ? Results.NotFound() : Results.Ok(form);
    }

    private static async Task<IResult> GetSupervisorFormsByDate(
     int supervisorTaqniaId,
     DateTime date,
     [FromServices] ApplicationDbContext db,
     [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching forms for supervisor with TaqniaID: {SupervisorTaqniaId} for date: {Date}", supervisorTaqniaId, date);
        var forms = await db.Forms
            .Where(f => f.SupervisorTaqniaID == supervisorTaqniaId && f.ProductivityDate.Date == date.Date)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Product)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Layer)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .ToListAsync();

        return forms.Any() ? Results.Ok(forms) : Results.NotFound();
    }
   

 
}