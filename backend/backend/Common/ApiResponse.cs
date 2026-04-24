namespace backend.Common
{
    /// <summary>
    /// A standardized envelope for all API responses.
    /// Ensures the frontend always receives a consistent JSON structure.
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public IEnumerable<string>? Errors { get; set; }

        // ── Factory helpers ──────────────────────────────────────────────────────

        public static ApiResponse<T> Ok(T data, string message = "Success") =>
            new() { Success = true, Message = message, Data = data };

        public static ApiResponse<T> Fail(string message, IEnumerable<string>? errors = null) =>
            new() { Success = false, Message = message, Errors = errors };
    }

    /// <summary>
    /// Non-generic version for responses that carry no payload (e.g., DELETE).
    /// </summary>
    public class ApiResponse : ApiResponse<object>
    {
        public static ApiResponse Ok(string message = "Success") =>
            new() { Success = true, Message = message };

        public static new ApiResponse Fail(string message, IEnumerable<string>? errors = null) =>
            new() { Success = false, Message = message, Errors = errors };
    }
}
