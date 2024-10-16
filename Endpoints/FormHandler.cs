using forms_api.Entities;

public static class FormHandler
{
    public static async Task<IResult> HandleExistingForm(Form formData, Form existingForm, ApplicationDbContext db, ILogger logger)
    {
        logger.LogInformation("Updating existing form with ID: {FormId}", existingForm.FormId);

        // Update basic form information
        existingForm.Comment = formData.Comment;
        existingForm.SubmissionDate = DateTime.Now;
        existingForm.EmployeeName = formData.EmployeeName;
        existingForm.SupervisorTaqniaID = formData.SupervisorTaqniaID;
        existingForm.ProductivityDate = formData.ProductivityDate;
        existingForm.ProductionRole = formData.ProductionRole;
        // Update form product
        if (formData.Product != null)
        {
            var product = await db.Products.FindAsync(formData.Product.Id);
            existingForm.Product = product ?? throw new InvalidOperationException($"Product with ID {formData.Product.Id} not found.");
        }

        // Delete existing DailyTargets
        db.DailyTargets.RemoveRange(existingForm.DailyTargets);

        // Add new DailyTargets
        existingForm.DailyTargets = new List<DailyTarget>();

        foreach (var targetData in formData.DailyTargets)
        {
            var newTarget = new DailyTarget
            {
                HoursWorked = targetData.HoursWorked,
                Productivity = targetData.Productivity,
                Layer = targetData.Layer?.Id != null ? await db.Layers.FindAsync(targetData.Layer.Id) : null,
                Remark = targetData.Remark?.Id != null ? await db.Remarks.FindAsync(targetData.Remark.Id) : null,
                Product = targetData.Product?.Id != null ? await db.Products.FindAsync(targetData.Product.Id) : null,
                ExpectedProductivity = 0,
                 IsQC = targetData.IsQC,
                 Completion = targetData.Completion
            };

            await UpdateSheetAssignment(newTarget, targetData, db, logger);
            await UpdateSheetLayerStatus(newTarget, targetData, db, logger);
            existingForm.DailyTargets.Add(newTarget);
        }

        // Update approval
        UpdateApproval(existingForm, formData.SupervisorTaqniaID);

        await db.SaveChangesAsync();
        return Results.Ok(existingForm);
    }

    public static async Task<IResult> HandleNewForm(Form formData, ApplicationDbContext db, ILogger logger)
    {
        logger.LogInformation("Creating new form");

        var newForm = new Form
        {
            TaqniaID = formData.TaqniaID,
            Comment = formData.Comment,
            SubmissionDate = DateTime.Now,
            ProductivityDate = formData.ProductivityDate,
            ProductionRole = formData.ProductionRole,
            EmployeeName = formData.EmployeeName,
            SupervisorTaqniaID = formData.SupervisorTaqniaID
        };

        // Set form product
        if (formData.Product != null)
        {
            var product = await db.Products.FindAsync(formData.Product.Id);
            newForm.Product = product ?? throw new InvalidOperationException($"Product with ID {formData.Product.Id} not found.");
        }

        // Create daily targets
        newForm.DailyTargets = new List<DailyTarget>();
        foreach (var targetData in formData.DailyTargets)
        {
            var newTarget = new DailyTarget
            {
                HoursWorked = targetData.HoursWorked,
                Productivity = targetData.Productivity,
                Layer = targetData.Layer?.Id != null ? await db.Layers.FindAsync(targetData.Layer.Id) : null,
                Remark = targetData.Remark?.Id != null ? await db.Remarks.FindAsync(targetData.Remark.Id) : null,
                Product = targetData.Product?.Id != null ? await db.Products.FindAsync(targetData.Product.Id) : null,
                ExpectedProductivity = 0,
                IsQC = targetData.IsQC,
                Completion = targetData.Completion
            };

            await UpdateSheetAssignment(newTarget, targetData, db, logger);
            await UpdateSheetLayerStatus(newTarget, targetData, db, logger);
            newForm.DailyTargets.Add(newTarget);
        }

        // Create approval
        newForm.Approvals.Add(new Approval
        {
            SupervisorTaqniaID = formData.SupervisorTaqniaID,
            State = FormState.pending,
            StepOrder = 0
        });

        db.Forms.Add(newForm);
        await db.SaveChangesAsync();
        return Results.Ok(newForm);
    }

    private static async Task UpdateSheetAssignment(DailyTarget target, DailyTarget targetData, ApplicationDbContext db, ILogger logger)
    {
        if (targetData.SheetAssignment != null)
        {
            var sheetAssignment = await db.SheetAssignments.FindAsync(targetData.SheetAssignment.SheetAssignmentId);
            if (sheetAssignment != null)
            {
                sheetAssignment.LayerId = targetData.Layer?.Id;
                sheetAssignment.InProgress = targetData.SheetAssignment.InProgress;
                sheetAssignment.IsQC = targetData.SheetAssignment.IsQC;
                target.SheetAssignment = sheetAssignment;
            }
            else
            {
                logger.LogWarning("SheetAssignment not found for TargetId: {TargetId}", targetData.TargetId);
            }
        }
    }

    private static async Task UpdateSheetLayerStatus(DailyTarget target, DailyTarget targetData, ApplicationDbContext db, ILogger logger)
    {
        if (targetData.SheetLayerStatus != null)
        {
            var sheetLayerStatus = await db.SheetLayerStatus.FindAsync(targetData.SheetLayerStatus.Id);
            if (sheetLayerStatus != null)
            {
                sheetLayerStatus.Completion = targetData.SheetLayerStatus.Completion;
                sheetLayerStatus.IsQCInProgress = targetData.SheetLayerStatus.IsQCInProgress;
                sheetLayerStatus.IsFinalQCInProgress = targetData.SheetLayerStatus.IsFinalQCInProgress;
                sheetLayerStatus.IsFinalizedQCInProgress = targetData.SheetLayerStatus.IsFinalizedQCInProgress;
                sheetLayerStatus.InProgress = targetData.SheetLayerStatus.InProgress;
                target.SheetLayerStatus = sheetLayerStatus;
            }
            else
            {
                logger.LogWarning("SheetLayerStatus not found for TargetId: {TargetId}", targetData.TargetId);
            }
        }
    }

    private static void UpdateApproval(Form existingForm, int? supervisorTaqniaId)
    {
        var firstApproval = existingForm.Approvals.FirstOrDefault(a => a.StepOrder == 0);
        if (firstApproval != null)
        {
            firstApproval.SupervisorTaqniaID = supervisorTaqniaId;
            firstApproval.State = FormState.pending;
            firstApproval.SupervisorComment = null;
        }
        else
        {
            existingForm.Approvals.Add(new Approval
            {
                SupervisorTaqniaID = supervisorTaqniaId,
                State = FormState.pending,
                StepOrder = 0
            });
        }
    }
}