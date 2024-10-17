using ClosedXML.Excel;
using forms_api.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static forms_api.Entities.SheetEntities;

public static class ExcelEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/dashboard/completed-sheets-excel", GetCompletedSheetsExcel)
             .WithName("GetCompletedSheetsExcel");


        app.MapGet("/api/dashboard/completed-sheet-statuses-excel", GetCompletedSheetStatusesExcel)
            .WithName("GetCompletedSheetStatusesExcel");




        app.MapGet("/api/dashboard/forms-excel", GetFormsExcel)
            .WithName("GetFormsExcel");


    }

    private static async Task<IResult> GetCompletedSheetsExcel(
       HttpContext context,
       [FromServices] ApplicationDbContext db,
       [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Generating Excel file for completed sheets, ignoring layers 4 and 7");
        var completedSheets = await db.Sheets
            .Where(s =>
                s.LayerStatuses.Where(ls => ls.LayerId != 4 && ls.LayerId != 7)
                                .All(ls => !ls.InProgress))
            .Select(s => new { s.SheetName, s.SheetId })
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Completed Sheets");

        // Set up headers
        worksheet.Cell(1, 2).Value = "Sheet Name";

        // Populate data
        var row = 2;
        foreach (var sheet in completedSheets)
        {
            worksheet.Cell(row, 2).Value = sheet.SheetName;
            row++;
        }

        // Auto-fit columns
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        context.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        context.Response.Headers.Add("Content-Disposition", $"attachment; filename=\"CompletedSheets_{DateTime.Now:yyyy-MM-dd}.xlsx\"");
        context.Response.ContentLength = stream.Length;

        await stream.CopyToAsync(context.Response.Body);
        return Results.Empty;
    }

    private static async Task<IResult> GetCompletedSheetStatusesExcel(
       HttpContext context,
       [FromServices] ApplicationDbContext db,
       [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Generating Excel file for completed sheet statuses");

        var layers = await db.Layers.ToListAsync();
        var completedStatuses = await db.SheetLayerStatus
            .Include(sls => sls.Sheet)
            .Include(sls => sls.Layer)
            .Where(sls => !sls.InProgress)
            .ToListAsync();

        using var workbook = new XLWorkbook();

        foreach (var layer in layers)
        {
            var worksheet = workbook.Worksheets.Add(layer.Name);

            // Set up headers
            worksheet.Cell(1, 2).Value = "Sheet Name";
            worksheet.Cell(1, 3).Value = "Production Status";
            worksheet.Cell(1, 4).Value = "QC Status";

            var layerStatuses = completedStatuses.Where(sls => sls.LayerId == layer.Id).ToList();
            var row = 2;

            foreach (var status in layerStatuses)
            {
                worksheet.Cell(row, 2).Value = status.Sheet.SheetName;
                worksheet.Cell(row, 3).Value = status.InProgress ? "In Progress" : "Completed";
                worksheet.Cell(row, 4).Value = status.IsQCInProgress ? "In Progress" : "Completed";


                row++;
            }

            // Auto-fit columns
            worksheet.Columns().AdjustToContents();
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        context.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        context.Response.Headers.Add("Content-Disposition", $"attachment; filename=\"CompletedSheetStatuses_{DateTime.Now:yyyy-MM-dd}.xlsx\"");
        context.Response.ContentLength = stream.Length;

        await stream.CopyToAsync(context.Response.Body);

        return Results.Empty;
    }
    private static async Task<IResult> GetFormsExcel(
     HttpContext context,
     [FromServices] ApplicationDbContext db,
     [FromQuery] DateTime date)
    {
        var forms = await db.Set<Form>()
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Product)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetLayerStatus)
                    .ThenInclude(sls => sls.Sheet)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.SheetAssignment)
                    .ThenInclude(sa => sa.Sheet)
            .Include(f => f.Approvals)
            .Where(f => f.ProductivityDate.Date == date.Date)
            .ToListAsync();

        var dailySheetAssignments = await db.Set<DailySheetAssignments>()
            .Where(dsa => dsa.AssignmentDate.Date == date.Date)
            .ToListAsync();

        using var workbook = new XLWorkbook();

        // Group forms by layer
        var formsByLayer = forms.GroupBy(f => f.DailyTargets.FirstOrDefault()?.Layer?.Name ?? "Unknown Layer");

        foreach (var layerGroup in formsByLayer)
        {
            var layerName = layerGroup.Key;
            var worksheet = workbook.Worksheets.Add(layerName);

            // Set up headers
            worksheet.Cell(1, 1).Value = "Form ID";
            worksheet.Cell(1, 2).Value = "Employee Name";
            worksheet.Cell(1, 3).Value = "Submission Date";
            worksheet.Cell(1, 4).Value = "Productivity Date";
            worksheet.Cell(1, 5).Value = "Layer";
            worksheet.Cell(1, 6).Value = "Total Productivity";
            worksheet.Cell(1, 7).Value = "Target Productivity";
            worksheet.Cell(1, 8).Value = "Products";
            worksheet.Cell(1, 9).Value = "Remarks";
            worksheet.Cell(1, 10).Value = "Production Role";
            worksheet.Cell(1, 11).Value = "Approval State";
            worksheet.Cell(1, 12).Value = "Comment";

            var row = 2;
            foreach (var form in layerGroup)
            {
                worksheet.Cell(row, 1).Value = form.FormId;
                worksheet.Cell(row, 2).Value = form.EmployeeName;
                worksheet.Cell(row, 3).Value = form.SubmissionDate;
                worksheet.Cell(row, 4).Value = form.ProductivityDate;
                worksheet.Cell(row, 5).Value = layerName;

                // Sum up productivities
                worksheet.Cell(row, 6).Value = form.DailyTargets.Sum(dt => dt.Productivity);

                // Calculate target productivity
                var relevantAssignments = dailySheetAssignments
                    .Where(dsa => dsa.TaqniaId == form.TaqniaID && dsa.AssignmentDate.Date == form.ProductivityDate)
                    .ToList();

                if (relevantAssignments.Any())
                {
                    var targetProductivity = relevantAssignments
                        .Sum(dsa => (dsa.Remark?.ToLower() == "dense") ? 0.5 : 1.0);
                    worksheet.Cell(row, 7).Value = targetProductivity;
                }

                // Combine products, remarks, and sheet numbers
                worksheet.Cell(row, 8).Value = string.Join(", ", form.DailyTargets.Select(dt => dt.Product?.Name).Distinct());
                worksheet.Cell(row, 9).Value = string.Join(", ", form.DailyTargets.Select(dt => dt.Remark?.Name).Distinct());
                worksheet.Cell(row, 10).Value = form.ProductionRole?.ToString();
                worksheet.Cell(row, 11).Value = form.Approvals.LastOrDefault()?.State?.ToString();
                worksheet.Cell(row, 12).Value = form.Comment;

                row++;
            }

            worksheet.Columns().AdjustToContents();
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        context.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        context.Response.Headers.Add("Content-Disposition", $"attachment; filename=\"Forms_{date:yyyy-MM-dd}.xlsx\"");
        context.Response.ContentLength = stream.Length;
        await stream.CopyToAsync(context.Response.Body);
        return Results.Empty;
    }
}