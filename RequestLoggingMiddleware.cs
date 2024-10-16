public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _logFilePath;
    private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public RequestLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
        _logFilePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "api_requests.log");
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var request = context.Request;
        var logEntry = $"{DateTime.UtcNow}: {context.Connection.RemoteIpAddress} {request.Method} {request.Path}";

        if (request.Method == HttpMethods.Post || request.Method == HttpMethods.Put || request.Method == HttpMethods.Delete || request.Method == HttpMethods.Get)
        {
            request.EnableBuffering();
            var bodyAsText = await new StreamReader(request.Body).ReadToEndAsync();
            request.Body.Position = 0;
            logEntry += $" Body: {bodyAsText}";
        }

        await _semaphore.WaitAsync();
        try
        {
            using (var stream = new FileStream(_logFilePath, FileMode.Append, FileAccess.Write, FileShare.Read))
            using (var writer = new StreamWriter(stream))
            {
                await writer.WriteLineAsync(logEntry);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log request: {ex.Message}");
        }
        finally
        {
            _semaphore.Release();
        }

        await _next(context);
    }
}
