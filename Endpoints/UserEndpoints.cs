using forms_api.Entities;
using forms_api.Services;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using static UserEndpoints;

public static class UserEndpoints
{
    public class LoginRequest
    {
        [Required]
        public string Username { get; set; }
        [Required]
        public string Password { get; set; }
    }
    public class VerifyOTPRequest
    {
        [Required]
        public string Username { get; set; }
        [Required]
        public string OTP { get; set; }
    }
    public class ChangePasswordRequest
    {
        [Required]
        public string NewPassword { get; set; }
    }

    public class SupervisorUpdateRequest
    {
        public int? SupervisorTaqniaID { get; set; }
    }

    public class SafeUser
    {
        public int TaqniaID { get; set; }
        public string? NationalID { get; set; }
        public string? Name { get; set; }
        public string? Product { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Username { get; set; }
        public string? layer { get; set; }
        public string? Role { get; set; }
        public string? EmployeeType { get; set; }
        public int? SupervisorTaqniaID { get; set; }
    }
    public static void MapEndpoints(WebApplication app)
    {
        app.MapPost("/api/users/toggle-otp", ToggleOTP)
         .WithName("ToggleOTP")
         .RequireAuthorization(policy => policy.RequireRole("superadmin", "admin"));

        app.MapPost("/api/users/login", InitiateLogin)
            .WithName("LoginUser")
            .AllowAnonymous();

        app.MapPost("/api/users/verify-otp", VerifyOTPAndLogin)
            .WithName("VerifyOTPAndLogin")
            .AllowAnonymous();

        app.MapGet("/api/users/otp-status", GetOTPStatus)
             .WithName("GetOTPStatus").AllowAnonymous();


        app.MapPut("/api/users/{taqniaId:int}/supervisor", UpdateSupervisor)
            .WithName("UpdateUserSupervisor")
            .RequireAuthorization(policy => policy.RequireRole("superadmin", "admin"));

        app.MapGet("/api/users/me", GetCurrentUser)
            .WithName("GetCurrentUser")
            .RequireAuthorization();

        app.MapPut("/api/users/password", ChangePassword)
            .WithName("ChangeUserPassword")
            .RequireAuthorization();

        app.MapGet("/api/users", GetAllUsers)
            .WithName("GetAllUsers")
            .RequireAuthorization();

        app.MapGet("/api/users/role/{role}", GetUsersByRole)
            .WithName("GetUsersByRole")
            .RequireAuthorization();

        app.MapPost("/api/users", CreateUser)
            .WithName("CreateUser")
            .RequireAuthorization(policy => policy.RequireRole("superadmin", "admin"));

        app.MapPut("/api/users/{taqniaId:int}", UpdateUser)
            .WithName("UpdateUser")
            .RequireAuthorization();

        app.MapDelete("/api/users/{taqniaId:int}", DeleteUser)
            .WithName("DeleteUser")
            .RequireAuthorization(policy => policy.RequireRole("superadmin", "admin"));
    }

    private static async Task<IResult> InitiateLogin(
     [FromBody] LoginRequest loginRequest,
     [FromServices] ApplicationDbContext db,
     [FromServices] OTPService otpService,
     [FromServices] JwtService jwtService,
     [FromServices] AppSettings appSettingsService,
     [FromServices] ILogger<Program> logger)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == loginRequest.Username);
        if (user is null)
        {
            logger.LogInformation("Login failed: User does not exist (username: {Username})", loginRequest.Username);
            return Results.BadRequest(new { message = "Incorrect Username or Password" });
        }

        if (!BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.Password))
        {
            logger.LogInformation("Login failed: Incorrect password (username: {Username})", loginRequest.Username);
            return Results.BadRequest(new { message = "Incorrect Username or Password" });
        }

        if (!appSettingsService.IsOTPEnabled())
        {
            var token = jwtService.GenerateJwtToken(user);
            logger.LogInformation("User logged in successfully (OTP disabled): {Username}", user.Username);
            return Results.Ok(new { token = token, message = "Login successful" });
        }
        var otpEntity = await db.OTPEntities.FirstOrDefaultAsync(o => o.TaqniaId == user.TaqniaID);
        if (otpEntity == null)
        {
            otpEntity = new OTPEntity { TaqniaId = user.TaqniaID };
            db.OTPEntities.Add(otpEntity);  
        }

        var otp = otpService.GenerateOTP();

        otpEntity.OTP = BCrypt.Net.BCrypt.HashPassword(otp);
        otpEntity.CreatedAt = DateTime.UtcNow;
        otpEntity.ExpiryTime = DateTime.UtcNow.AddMinutes(5);
        otpEntity.IsUsed = false;
        otpEntity.Purpose = "Login";

        await db.SaveChangesAsync();
        await db.SaveChangesAsync();

        try
        {
            if (!string.IsNullOrEmpty(user.Email) && user.Email.Contains("@ets.com.sa"))
            {
                await otpService.SendOTPEmail(user.Email, otp);
                logger.LogInformation("OTP sent for user login: {Username}", user.Username);
                return Results.Ok(new { message = "OTP sent to your email. Please verify to complete login." });
            }
            else
            {
                logger.LogError("No valid email for user: {Username}", user.Username);
                return Results.BadRequest(new { message = "No valid email associated with this account" });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send OTP email for user: {Username}", user.Username);
            return Results.BadRequest(new { message = "Failed to send OTP. Please try again later." });
        }
    }

    private static async Task<IResult> GetOTPStatus(
      [FromServices] AppSettings appSettingsService,
      [FromServices] ILogger<Program> logger)
    {
        bool isEnabled = appSettingsService.IsOTPEnabled();
        logger.LogInformation("OTP status checked. Current status: {Status}", isEnabled ? "enabled" : "disabled");
        return Results.Ok(new { otpEnabled = isEnabled });
    }

    private static async Task<IResult> VerifyOTPAndLogin(
         [FromBody] VerifyOTPRequest request,
         [FromServices] ApplicationDbContext db,
         [FromServices] JwtService jwtService,
         [FromServices] ILogger<Program> logger)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user is null)
        {
            return Results.NotFound("User not found");
        }

        var otpEntity = await db.OTPEntities.FirstOrDefaultAsync(o => o.TaqniaId == user.TaqniaID);
        if(otpEntity == null)
            logger.LogWarning("No OTP entity found {request.Username}", request.Username);

        if (otpEntity == null || !BCrypt.Net.BCrypt.Verify(request.OTP, otpEntity.OTP) || otpEntity.IsUsed || otpEntity.ExpiryTime <= DateTime.UtcNow)
        {
            logger.LogWarning("OTP verification failed for user: {Username}", request.Username);
            return Results.BadRequest(new { message = "Invalid or expired OTP" });
        }

        otpEntity.IsUsed = true;
        await db.SaveChangesAsync();

        var token = jwtService.GenerateJwtToken(user);
        logger.LogInformation("User logged in successfully: {Username}", user.Username);

        return Results.Ok(new { token = token, message = "OTP verified successfully" });
    }
    private static async Task<IResult> ToggleOTP(
     [FromServices] AppSettings appSettingsService,
     [FromServices] ILogger<Program> logger)
    {
        bool newState = !appSettingsService.IsOTPEnabled();
        await appSettingsService.SetOTPEnabled(newState);
        logger.LogInformation("OTP has been {State}", newState ? "enabled" : "disabled");
        return Results.Ok(new { Message = $"OTP has been {(newState ? "enabled" : "disabled")}" });
    }

    private static async Task<IResult> UpdateSupervisor(
        [FromRoute] int taqniaId,
        [FromBody] SupervisorUpdateRequest request,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        var user = await db.Users.FindAsync(taqniaId);
        if (user is null) return Results.NotFound();

        user.SupervisorTaqniaID = request.SupervisorTaqniaID;
        await db.SaveChangesAsync();
        logger.LogInformation("User's supervisor updated successfully. TaqniaID: {TaqniaId}, New SupervisorTaqniaID: {SupervisorTaqniaID}", taqniaId, request.SupervisorTaqniaID);
        return Results.NoContent();
    }


    private static async Task<IResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        ClaimsPrincipal claimsPrincipal,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        var taqniaId = int.Parse(claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier));
        var user = await db.Users.FindAsync(taqniaId);
        if (user is null) return Results.NotFound();

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync();
        logger.LogInformation("Password changed for user: {Username}", user.Username);
        return Results.NoContent();
    }



    private static async Task<IResult> CreateUser(
            [FromBody] User user,
            [FromServices] ApplicationDbContext db,
            [FromServices] ILogger<Program> logger)
    {
        if (string.IsNullOrEmpty(user.Username))
        {
            user.Username = !string.IsNullOrEmpty(user.Email) && user.Email.Contains("@")
                ? user.Email.Split('@')[0]
                : user.TaqniaID.ToString();
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(string.IsNullOrEmpty(user.Password) ? user.TaqniaID.ToString() : user.Password);

        var existingUser = await db.Users.AnyAsync(u => u.TaqniaID == user.TaqniaID || u.Username == user.Username);
        if (existingUser)
        {
            logger.LogWarning("User creation failed. TaqniaID or Username already exists.");
            return Results.Conflict("A user with this TaqniaID or Username already exists.");
        }

        db.Users.Add(user);
        await db.SaveChangesAsync();
        logger.LogInformation("User created successfully with TaqniaID: {TaqniaId}", user.TaqniaID);
        return Results.Created($"/api/users/{user.TaqniaID}", MapToUserWithoutPassword(user));
    }

    private static async Task<IResult> UpdateUser(
        [FromRoute] int taqniaId,
        [FromBody] User updatedUser,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        var user = await db.Users
            .Include(u => u.ProductAssignment)
            .Include(u => u.LayerAssignment)
            .FirstOrDefaultAsync(u => u.TaqniaID == taqniaId);

        if (user is null) return Results.NotFound();

        // Update all properties except Password and SheetAssignments
        user.NationalID = updatedUser.NationalID;
        user.Name = updatedUser.Name;
        user.Product = updatedUser.Product;
        user.Email = updatedUser.Email;
        user.PhoneNumber = updatedUser.PhoneNumber;
        user.Username = updatedUser.Username;
        user.Role = updatedUser.Role;
        user.SupervisorTaqniaID = updatedUser.SupervisorTaqniaID;
        user.Layer = updatedUser.Layer;
        user.EmployeeType = updatedUser.EmployeeType;

        // Handle potential null ProductAssignment
        if (updatedUser.ProductAssignment != null)
        {
            user.ProductAssignmentId = updatedUser.ProductAssignment.Id;
        }
        else
        {
            user.ProductAssignmentId = null;
        }

        // Handle potential null LayerAssignment
        if (updatedUser.LayerAssignment != null)
        {
            user.LayerAssignmentId = updatedUser.LayerAssignment.Id;
        }
        else
        {
            user.LayerAssignmentId = null;
        }

        user.ProductionRole = updatedUser.ProductionRole;

        try
        {
            await db.SaveChangesAsync();
            logger.LogInformation("User updated successfully with TaqniaID: {TaqniaId}", taqniaId);
            return Results.NoContent();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating user with TaqniaID: {TaqniaId}", taqniaId);
            return Results.BadRequest("Failed to update user. Please try again.");
        }
    }

    private static async Task<IResult> DeleteUser(
        [FromRoute] int taqniaId,
        [FromServices] ApplicationDbContext db,
        [FromServices] ILogger<Program> logger)
    {
        var user = await db.Users.FindAsync(taqniaId);
        if (user is null) return Results.NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        logger.LogInformation("User deleted successfully with TaqniaID: {TaqniaId}", taqniaId);
        return Results.NoContent();
    }

    private static async Task<IResult> GetCurrentUser(
        ClaimsPrincipal claimsPrincipal,
        [FromServices] ApplicationDbContext db)
    {
        var taqniaId = int.Parse(claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier));
        var user = await db.Users
            .Include(u => u.ProductAssignment)
            .Include(u => u.LayerAssignment)
            .FirstOrDefaultAsync(u => u.TaqniaID == taqniaId);
        return user is null ? Results.NotFound() : Results.Ok(MapToUserWithoutPassword(user));
    }

    private static async Task<IResult> GetAllUsers([FromServices] ApplicationDbContext db)
    {
        var users = await db.Users
            .Include(u => u.ProductAssignment)
            .Include(u => u.LayerAssignment)
            .Where(f => f.Role != "superadmin" && f.Role != "CEO")
            .Select(u => MapToUserWithoutPassword(u))
            .ToListAsync();
        return Results.Ok(users);
    }

    private static async Task<IResult> GetUsersByRole(
        [FromRoute] string role,
        [FromServices] ApplicationDbContext db)
    {
        var users = await db.Users
            .Include(u => u.ProductAssignment)
            .Include(u => u.LayerAssignment)
            .Where(u => u.Role == role)
            .Select(u => MapToUserWithoutPassword(u))
            .ToListAsync();
        return users.Any() ? Results.Ok(users) : Results.NotFound($"No users found with role: {role}");
    }
    private static User MapToUserWithoutPassword(User user)
    {
        var userWithoutPassword = new User
        {
            TaqniaID = user.TaqniaID,
            NationalID = user.NationalID,
            Name = user.Name,
            Product = user.Product,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Username = user.Username,
            Layer = user.Layer,
            Role = user.Role,
            EmployeeType = user.EmployeeType,
            SupervisorTaqniaID = user.SupervisorTaqniaID,
            ProductAssignment = user.ProductAssignment,
            LayerAssignment = user.LayerAssignment,
                        ProductionRole = user.ProductionRole

        };
        return userWithoutPassword;
    }
}
