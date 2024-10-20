using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using forms_api.Services;


var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(80);

});


builder.Services.AddHttpClient();
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySQL("Server=localhost;Database=delivery3_2;User=root;Password=Taqnia@123;SslMode=None;AllowPublicKeyRetrieval=True"));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<OTPService>();
builder.Services.AddSingleton<AppSettings>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ClockSkew = TimeSpan.Zero
        };
    });


builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
        .Build();
});


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddResponseCompression();


var app = builder.Build();


app.UseMiddleware<RequestLoggingMiddleware>();


app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "react/dist")),
    RequestPath = "",
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name == "index.html")
        {
            ctx.Context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            ctx.Context.Response.Headers["Pragma"] = "no-cache";
            ctx.Context.Response.Headers["Expires"] = "0";
        }
    }
});

app.MapFallback(context =>
{
    context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    context.Response.Headers["Pragma"] = "no-cache";
    context.Response.Headers["Expires"] = "0";
    context.Response.ContentType = "text/html";
    return context.Response.SendFileAsync(Path.Combine(Directory.GetCurrentDirectory(), "react/dist", "index.html"));
}).AllowAnonymous();


app.UseCors();

app.UseAuthentication();
app.UseAuthorization(); 


app.UseDeveloperExceptionPage();


SheetsEndpoints.MapEndpoints(app);
TargetsEndpoints.MapEndpoints(app);
UserEndpoints.MapEndpoints(app);
FormEndpoints.MapEndpoints(app);
LayerRemarkEndpoints.MapEndpoints(app);
ApprovalEndpoints.MapEndpoints(app);
CalculationEndpoints.MapEndpoints(app);
DashboardEndpoints.MapEndpoints(app);
LinksEndpoints.MapEndpoints(app);
AttendanceEndpoints.MapEndpoints(app);
WeeklyTargetEndpoints.MapEndpoints(app);
SheetAssignmentsEndpoints.MapEndpoints(app);
SheetLayerEndpoints.MapEndpoints(app);
ExcelEndpoints.MapEndpoints(app);

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var dbContext = services.GetRequiredService<ApplicationDbContext>();
    var logger = services.GetRequiredService<ILogger<PasswordEncryptionService>>();

    var dataImportService = new DataImportService(dbContext);
    var passwordEncryptionService = new PasswordEncryptionService(dbContext, logger);
   //await  passwordEncryptionService.CheckAndEncryptPasswords();
  //await dataImportService.EnsureSheetLayerStatusEntries();
        //string jsonContent = File.ReadAllText(@"C:\Users\ralmaiman\Desktop\output.json");
    //await dataImportService.ImportDailySheetAssignments(@"C:\Users\ralmaiman\Desktop\Road_(13-17Oct).xlsx", 5, 4, 1, 3, 2, 2);
}

app.Run();
