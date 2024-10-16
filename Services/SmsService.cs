using System.Globalization;
using System.Net.Http;
using System.Text;
using System.Text;
using System.Text.Json;
public class SmsService
{
    private readonly HttpClient _httpClient;
    private const string ApiUrl = "https://basic.unifonic.com/rest/SMS/messages";
    private const string AppSid = "m7gYKEdJOBduPuo0doQLiKIoHZBUbQ";

    public SmsService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }
    public async Task SendOtpAsync(string phoneNumber, string otpCode)
    {
        try
        {
            TimeZoneInfo riyadhTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Arabian Standard Time");
            DateTime riyadhTime = TimeZoneInfo.ConvertTime(DateTime.UtcNow, riyadhTimeZone);
            string formattedDate = riyadhTime.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);

            string otpMessage = $"Authentication code for makanforms: {otpCode} \r \r (Sent on: {formattedDate} Riyadh Time)";

            var data = new Dictionary<string, string>
        {
            { "AppSid", AppSid },
            { "Recipient", phoneNumber },
            { "Body", otpMessage }
        };

            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(ApiUrl, content);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadAsStringAsync();
        }
        catch (Exception ex)
        {
            throw ex;
        }
    }
}
