using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

public static class AttendanceEndpoints
{
    public static void MapEndpoints(WebApplication app)
    {
        app.MapGet("/api/attendance/first-last/{userId}", GetUserAttendance)
            .WithName("GetUserAttendance");

        app.MapPost("/api/attendance/bulk-first-last", GetBulkUserAttendance)
            .WithName("GetBulkUserAttendance");
    }

    private static async Task<IResult> GetUserAttendance(
        [FromRoute] string userId,
        [FromQuery] string date,
        [FromServices] IHttpClientFactory clientFactory
    )
    {
        var client = clientFactory.CreateClient();
        var externalApiUrl = "https://attendance.taqniaets.com/api/v2.1";
        var token = GenerateAttendanceToken();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.GetAsync($"{externalApiUrl}/first_last/{userId}?date={date}");
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadFromJsonAsync<Dictionary<string, UserAttendance>>();
            return Results.Ok(content?[userId]);
        }
        return Results.StatusCode((int)response.StatusCode);
    }

    private static async Task<IResult> GetBulkUserAttendance(
        [FromBody] BulkAttendanceRequest request,
        [FromServices] IHttpClientFactory clientFactory
    )
    {
        var client = clientFactory.CreateClient();
        var externalApiUrl = "https://attendance.taqniaets.com/api/v2.1";
        var token = GenerateAttendanceToken();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var tasks = request.UserIds.Select(userId => client.GetAsync($"{externalApiUrl}/first_last/{userId}?date={request.Date}"));
        var responses = await Task.WhenAll(tasks);

        var result = new Dictionary<string, UserAttendance>();

        for (int i = 0; i < responses.Length; i++)
        {
            var response = responses[i];
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadFromJsonAsync<Dictionary<string, UserAttendance>>();
                if (content != null && content.Any())
                {
                    result[request.UserIds[i]] = content.First().Value;
                }
            }
        }

        return Results.Ok(result);
    }

    private static string GenerateAttendanceToken()
    {
        var secret = "Taqnia@123123!!"; // The required secret
        if (string.IsNullOrEmpty(secret))
            throw new InvalidOperationException("JWT secret is not configured");
        using (var sha256 = SHA256.Create())
        {
            var keyBytes = sha256.ComputeHash(Encoding.ASCII.GetBytes(secret));
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = new SymmetricSecurityKey(keyBytes);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] { new Claim("id", "Riyan Almaiman") }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}

public class PunchData
{
    public int device_id { get; set; }
    public int id { get; set; }
    public string timestamp { get; set; }
    public int transaction_type { get; set; }
}

public class UserAttendance
{
    public PunchData first_punch { get; set; }
    public PunchData last_punch { get; set; }
}

public class BulkAttendanceRequest
{
    public List<string> UserIds { get; set; }
    public string Date { get; set; }
}