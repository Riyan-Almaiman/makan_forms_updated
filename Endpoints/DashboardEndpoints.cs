using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using forms_api.Entities;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;

public static class DashboardEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {




        //--------------------------project targets-------------------------------//

        app.MapGet("/api/dashboard/project-targets/{deliveryNumber}/{productId}", GetProjectTargetsByDeliveryNumber)
                 .WithName("GetProjectTargetsByDeliveryNumber");

        app.MapGet("/api/dashboard/completed-sheets-count/{productId}/{deliveryNumber}", GetCompletedSheetsCount)
            .WithName("GetCompletedSheetsCount");

        //---------------------------------------------------------//


        app.MapGet("/api/dashboard/supervisor-team-overview", GetSupervisorTeamOverview)
          .WithName("GetSupervisorTeamOverview");

        app.MapGet("/api/dashboard/editor-performance/{taqniaId}", GetEditorPerformance)
            .WithName("GetEditorPerformance");




        app.MapGet("/api/dashboard/forms/{date}/{layerId}/{productId}/{productionRole}", GetFormsByDateAndLayerId)
         .WithName("GetFormsByDateAndLayerId");

        app.MapGet("/api/dashboard/productivity/{date}", GetProductivityDashboard)
            .WithName("GetProductivityDashboard");


        app.MapGet("/api/dashboard/weekly-targets/{startDate}/{endDate}/{productId}/{productionRole}", GetWeeklyTargetsWithActuals)
              .WithName("GetWeeklyTargetsWithActuals");





    }

    private static async Task<IResult> GetProjectTargetsByDeliveryNumber(
         int deliveryNumber,
         int productId,
         [FromServices] ApplicationDbContext db,
         [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching project targets for delivery number: {DeliveryNumber} and product ID: {ProductId}", deliveryNumber, productId);

        var layerCounts = await db.SheetLayerStatus
            .Where(sls => sls.Sheet.DeliveryNumber == deliveryNumber && sls.ProductId == productId)
            .GroupBy(sls => sls.Layer)
            .Select(g => new
            {
                LayerId = g.Key.Id,
                LayerName = g.Key.Name,
                TotalSheets = g.Count(),
                InProgressSheetCount = g.Count(sls => sls.InProgress),
                CompletedSheetCount = g.Count(sls => !sls.InProgress),
                CompletedQCCount = g.Count(sls => !sls.IsQCInProgress),
                CompletedFinalQCCount = g.Count(sls => !sls.IsFinalQCInProgress),
                CompletedFinalizedQCCount = g.Count(sls => !sls.IsFinalizedQCInProgress)
            })
            .ToListAsync();

     

        var result = new
        {
            DeliveryNumber = deliveryNumber,
            ProductId = productId,
            TotalInProgressSheets = layerCounts.Sum(lc => lc.InProgressSheetCount),
            TotalCompletedSheets = layerCounts.Sum(lc => lc.CompletedSheetCount),
            TotalCompletedQC = layerCounts.Sum(lc => lc.CompletedQCCount),
            TotalCompletedFinalQC = layerCounts.Sum(lc => lc.CompletedFinalQCCount),
            TotalCompletedFinalizedQC = layerCounts.Sum(lc => lc.CompletedFinalizedQCCount),
            LayerData = layerCounts
        };

        return Results.Ok(result);
    }

    private static async Task<IResult> GetCompletedSheetsCount(
        int productId,
        int deliveryNumber,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching count of completed sheets for product ID: {ProductId}, ignoring layers 4 and 7", productId);

        var completedSheetsCount = await db.SheetLayerStatus
            .Where(sls => sls.ProductId == productId && sls.DeliveryNumber == deliveryNumber)
            .Where(sls => sls.LayerId != 4 && sls.LayerId != 7 && sls.LayerId != 8)
            .GroupBy(sls => sls.SheetId)
            .CountAsync(g => g.All(sls => !sls.InProgress));

        return Results.Ok(new { CompletedSheetsCount = completedSheetsCount });
    }


    private static async Task<IResult> GetSupervisorTeamOverview(
        string date,
        ProductionRole productionRole,
        int productId,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching supervisor team overview for product: {Date}", productId);
        var dashboardDate = DateTime.Parse(date);

        // Get all layers
        var layers = await db.Layers.ToListAsync();

        // Get all supervisors with their assigned layers
        var supervisors = await db.Users
            .Where(u => u.Role == "supervisor")
            .Select(u => new
            {
                u.TaqniaID,
                u.Name,
                LayerId = u.LayerAssignmentId ?? 0
            })
            .ToListAsync();

        var result = new Dictionary<int, object>();

        foreach (var layer in layers)
        {
            var layerSupervisors = supervisors.Where(s => s.LayerId == layer.Id).ToList();

            // Add special supervisors for this layer
            if (layer.Id == 5 || layer.Id == 6)
            {
                layerSupervisors.Add(supervisors.FirstOrDefault(s => s.TaqniaID == 4804));
            }
            if (layer.Id == 4 || layer.Id == 7)
            {
                layerSupervisors.Add(supervisors.FirstOrDefault(s => s.TaqniaID == 4591));
            }

            var layerData = new Dictionary<string, object>();

            foreach (var supervisor in layerSupervisors.Where(s => s != null))
            {
                var editors = await db.Users
                    .Where(u => u.Role == "editor" &&
                                u.LayerAssignmentId == layer.Id &&
                                u.ProductAssignmentId == productId &&
                                u.SupervisorTaqniaID == supervisor.TaqniaID &&
                                u.ProductionRole == productionRole)
                    .Select(u => new { u.TaqniaID, u.Name })
                    .ToListAsync();

                var editorStatuses = new Dictionary<string, object>();

                foreach (var editor in editors)
                {
                    var form = await db.Forms
                        .Include(f => f.Approvals)
                        .Where(f => f.TaqniaID == editor.TaqniaID && f.ProductivityDate.Date == dashboardDate.Date)
                        .FirstOrDefaultAsync();

                    var formStatus = "No Form";
                    if (form != null && form.Approvals.Any())
                    {
                        formStatus = form.Approvals[0].State?.ToString() ?? "Unknown";
                    }

                    editorStatuses[editor.Name] = new
                    {
                        HasForm = form != null,
                        Status = formStatus
                    };
                }

                layerData[supervisor.Name] = editorStatuses;
            }

            result[layer.Id] = new
            {
                LayerName = layer.Name,
                Supervisors = layerData
            };
        }

        return Results.Ok(result);
    }

    private static async Task<IResult> GetFormsByDateAndLayerId(
        string date,
        int layerId,
        int productId,
        ProductionRole productionRole,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching forms for date: {Date}, layer ID: {LayerId}, product ID: {ProductId}, production role: {ProductionRole}",
            date, layerId, productId, productionRole);

        var dashboardDate = DateTime.Parse(date);
        var forms = await db.Forms
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.Approvals)
            .Include(f => f.Product)
            .Include(f => f.User)
            .Where(f => f.ProductivityDate.Date == dashboardDate.Date &&
                        f.DailyTargets.Any(dt => dt.Layer != null && dt.Layer.Id == layerId) &&
                        f.Product.Id == productId &&
                        f.ProductionRole == productionRole)
            .Select(f => new
            {
                f.FormId,
                f.EmployeeName,
                f.TaqniaID,
                NationalID = f.User != null ? f.User.NationalID : null,
                EmployeeType = f.User.EmployeeType,
                ProductName = f.Product.Name,
                f.Comment,
                f.ProductivityDate,
                DailyTargets = f.DailyTargets.Where(dt => dt.Layer != null && dt.Layer.Id == layerId).Select(dt => new
                {
                    dt.HoursWorked,
                    dt.Productivity,
                    dt.ExpectedProductivity,
                    RemarkName = dt.Remark.Name,
                    dt.SheetNumber,
                }),
                ApprovalStatus = f.Approvals.OrderByDescending(a => a.StepOrder).Select(a => a.State).FirstOrDefault()
            })
            .ToListAsync();

        if (!forms.Any())
        {
            return Results.NotFound($"No forms found for date {date}, layer ID {layerId}, product ID {productId}, and production role {productionRole}");
        }

        return Results.Ok(forms);
    }
    private static async Task<IResult> GetProductivityDashboard(
    string date,
    int productId,
    ProductionRole productionRole,
    [FromServices] ApplicationDbContext db,
    [FromServices] ILogger<Program> logger)
    {
        try
        {
            // Validate input parameters
            if (string.IsNullOrEmpty(date) || productId <= 0)
            {
                logger.LogWarning("Invalid input parameters: date={Date}, productId={ProductId}", date, productId);
                return Results.BadRequest("Invalid input parameters");
            }

            logger.LogInformation("Fetching productivity dashboard for date: {Date}, productId: {ProductId}, productionRole: {ProductionRole}", date, productId, productionRole);
            var dashboardDate = DateTime.Parse(date);
            var weekStart = GetStartOfWeek(dashboardDate);
            var dayOfWeek = dashboardDate.DayOfWeek;

            // Fetch all required data upfront
            var forms = await db.Forms
                .Include(f => f.DailyTargets)
                    .ThenInclude(dt => dt.Layer)
                .Include(f => f.DailyTargets)
                    .ThenInclude(dt => dt.Remark)
                .Include(f => f.Approvals)
                .Include(f => f.Product)
                .Where(f => f.ProductivityDate.Date == dashboardDate.Date &&
                            f.Product.Id == productId &&
                            f.ProductionRole == productionRole &&
                            f.Approvals.Any(a => a.State == FormState.approved))
                .ToListAsync();

            logger.LogInformation("Retrieved {FormCount} forms", forms.Count);

            var weeklyTargets = await db.WeeklyTargets
                .Include(wt => wt.Layer)
                .Where(wt => wt.WeekStart == weekStart &&
                             wt.ProductId == productId &&
                             wt.ProductionRole == productionRole)
                .ToListAsync();

            logger.LogInformation("Retrieved {WeeklyTargetCount} weekly targets", weeklyTargets.Count);

            var editors = await db.Users
                .Where(u => u.Role == "editor" &&
                            u.ProductionRole == productionRole &&
                            u.ProductAssignment.Id == productId)
                .ToListAsync();

            logger.LogInformation("Retrieved {EditorCount} editors", editors.Count);

            // Process data without further database queries
            var layerData = weeklyTargets.Select(wt =>
            {
                var layerForms = forms.Where(f => f.DailyTargets.Any(dt => dt.Layer?.Id == wt.LayerId)).ToList();
                var layerDailyTargets = layerForms.SelectMany(f => f.DailyTargets.Where(dt => dt.Layer?.Id == wt.LayerId)).ToList();
                var remarks = layerDailyTargets
                    .GroupBy(dt => dt.Remark?.Name ?? "Unknown")
                    .ToDictionary(
                        g => g.Key,
                        g => g.Sum(dt => dt.Productivity)
                    );

                var totalEditors = editors.Count(e => e.LayerAssignment != null && e.LayerAssignment.Id == wt.LayerId);

                return new
                {
                    LayerId = wt.LayerId,
                    LayerName = wt.Layer?.Name ?? "Unknown Layer",
                    TargetAmount = GetDailyAmount(wt, dayOfWeek) ?? 0,
                    Remarks = remarks,
                    AchievedAmount = remarks.Values.Sum(),
                    TotalForms = layerForms.Count,
                    TotalEditors = totalEditors
                };
            }).ToList();

            logger.LogInformation("Processed {LayerDataCount} layer data entries", layerData.Count);

            var response = new
            {
                Date = dashboardDate.ToString("yyyy-MM-dd"),
                ProductId = productId,
                ProductionRole = productionRole.ToString(),
                LayerData = layerData
            };

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while fetching the productivity dashboard");
            return Results.StatusCode(500);
        }
    }

    private static async Task<IResult> GetWeeklyTargetsWithActuals(
      string startDate,
      string endDate,
      int productId,
      ProductionRole productionRole,
      [FromServices] ApplicationDbContext db,
      [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching weekly targets for date range: {StartDate} to {EndDate}, product ID: {ProductId}, and production role: {ProductionRole}", startDate, endDate, productId, productionRole);
        var start = DateTime.Parse(startDate);
        var end = DateTime.Parse(endDate);
        var weeklyTargets = await db.WeeklyTargets
            .Include(wt => wt.Layer)
            .Where(wt => wt.ProductId == productId && wt.ProductionRole == productionRole && wt.WeekStart >= start && wt.WeekStart <= end)
            .ToListAsync();

        logger.LogInformation($"Found {weeklyTargets.Count} weekly targets");
        var result = new List<object>();
        foreach (var weeklyTarget in weeklyTargets)
        {
            var weeklyActuals = new List<object>();
            for (int i = 0; i < 5; i++)
            {
                var weekStart = weeklyTarget.WeekStart.AddDays(-7 * i);
                var weekEnd = weekStart.AddDays(6);
                var dailyTargetsSum = await db.DailyTargets
                    .Include(dt => dt.Form)
                        .ThenInclude(f => f.Product)
                    .Include(dt => dt.Form)
                        .ThenInclude(f => f.Approvals)
                    .Where(dt => dt.Form.Product.Id == productId &&
                                 dt.Layer.Id == weeklyTarget.Layer.Id &&
                                 dt.Form.ProductivityDate >= weekStart &&
                                 dt.Form.ProductivityDate <= weekEnd &&
                                 dt.Form.ProductionRole == productionRole &&
                                 dt.Form.Approvals.Any(a => a.State == FormState.approved))
                    .SumAsync(dt => dt.Productivity);
                weeklyActuals.Add(new
                {
                    WeekStart = weekStart.ToString("yyyy-MM-dd"),
                    ActualAmount = dailyTargetsSum
                });
            }

            var allDatesInWeek = Enumerable.Range(0, 7)
                .Select(offset => weeklyTarget.WeekStart.AddDays(offset))
                .ToList();

            var dailyActuals = await db.DailyTargets
                .Include(dt => dt.Form)
                    .ThenInclude(f => f.Product)
                .Include(dt => dt.Form)
                    .ThenInclude(f => f.Approvals)
                .Where(dt => dt.Form.Product.Id == productId &&
                             dt.Layer.Id == weeklyTarget.Layer.Id &&
                             dt.Form.ProductivityDate >= weeklyTarget.WeekStart &&
                             dt.Form.ProductivityDate <= weeklyTarget.WeekStart.AddDays(6) &&
                             dt.Form.ProductionRole == productionRole &&
                             dt.Form.Approvals.Any(a => a.State == FormState.approved))
                .GroupBy(dt => dt.Form.ProductivityDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    ActualAmount = g.Sum(dt => dt.Productivity)
                })
                .ToListAsync();
            var formattedDailyActuals = allDatesInWeek.Select(date =>
            {
                var dayOfWeek = (int)date.DayOfWeek;
                // No need to adjust for week start since Sunday is already 0
                decimal? target = dayOfWeek switch
                {
                    0 => weeklyTarget.SundayAmount,
                    1 => weeklyTarget.MondayAmount,
                    2 => weeklyTarget.TuesdayAmount,
                    3 => weeklyTarget.WednesdayAmount,
                    4 => weeklyTarget.ThursdayAmount,
                    5 => weeklyTarget.FridayAmount,
                    6 => weeklyTarget.SaturdayAmount,
                    _ => 0
                };

                return new
                {
                    Target = target ?? 0,
                    Date = date.ToString("yyyy-MM-dd"),
                    ActualAmount = dailyActuals.FirstOrDefault(d => d.Date == date)?.ActualAmount ?? 0
                };
            }).ToList();
            result.Add(new
            {
                WeekStart = weeklyTarget.WeekStart.ToString("yyyy-MM-dd"),
                LayerId = weeklyTarget.Layer.Id,
                LayerName = weeklyTarget.Layer.Name,
                WeeklyTargetAmount = weeklyTarget.Amount,
                WeeklyActuals = weeklyActuals,
                DailyActuals = formattedDailyActuals
            });

            logger.LogInformation($"Processed weekly target for {weeklyTarget.WeekStart:yyyy-MM-dd}. Daily actuals count: {formattedDailyActuals.Count}");
        }
        return result.Any() ? Results.Ok(result) : Results.NotFound("No weekly targets found for the specified date range, product, and production role.");
    }
    private static async Task<IResult> GetEditorPerformance(
        int taqniaId,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        logger.LogInformation("Fetching editor performance for TaqniaID: {TaqniaId}", taqniaId);
        var endDate = DateTime.UtcNow.Date;
        var startDate = endDate.AddDays(-29);
        var forms = await db.Forms
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Layer)
            .Include(f => f.DailyTargets)
                .ThenInclude(dt => dt.Remark)
            .Include(f => f.Product)
            .Include(f => f.User)
            .Where(f => f.TaqniaID == taqniaId && f.ProductivityDate >= startDate && f.ProductivityDate <= endDate)
            .OrderBy(f => f.ProductivityDate)
            .ToListAsync();

        var editorName = forms.FirstOrDefault()?.User?.Name ?? "Unknown Editor";

        var result = new List<object>();
        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var form = forms.FirstOrDefault(f => f.ProductivityDate.Date == date.Date);
            if (form != null)
            {
                result.Add(new
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    FormId = form.FormId,
                    EditorName = editorName,
                    ProductName = form.Product?.Name,
                    TotalHoursWorked = form.DailyTargets.Sum(dt => dt.HoursWorked),
                    TotalProductivity = form.DailyTargets.Sum(dt => dt.Productivity),
                    DailyTargets = form.DailyTargets.Select(dt => new
                    {
                        LayerName = dt.Layer?.Name,
                        dt.HoursWorked,
                        dt.Productivity,
                        dt.ExpectedProductivity,
                        RemarkName = dt.Remark?.Name,
                        dt.SheetNumber
                    }).ToList()
                });
            }
            else
            {
                result.Add(new
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    FormId = (int?)null,
                    EditorName = editorName,
                    ProductName = (string)null,
                    TotalHoursWorked = 0.0,
                    TotalProductivity = 0.0,
                    DailyTargets = new List<object>()
                });
            }
        }

        if (!result.Any())
        {
            return Results.NotFound($"No forms found for TaqniaID {taqniaId} in the last 30 days");
        }

        return Results.Ok(new
        {
            EditorName = editorName,
            PerformanceData = result
        });
    }


    private static DateTime GetStartOfWeek(DateTime date)
    {
        int diff = (7 + (date.DayOfWeek - DayOfWeek.Sunday)) % 7;
        return date.Date.AddDays(-1 * diff).Date;
    }

    private static decimal? GetDailyAmount(WeeklyTarget wt, DayOfWeek dayOfWeek)
    {
        return dayOfWeek switch
        {
            DayOfWeek.Sunday => wt.SundayAmount,
            DayOfWeek.Monday => wt.MondayAmount,
            DayOfWeek.Tuesday => wt.TuesdayAmount,
            DayOfWeek.Wednesday => wt.WednesdayAmount,
            DayOfWeek.Thursday => wt.ThursdayAmount,
            DayOfWeek.Friday => wt.FridayAmount,
            DayOfWeek.Saturday => wt.SaturdayAmount,
            _ => null
        };
    }


}