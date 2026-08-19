namespace PrakashMart.Application.Common.Exceptions;

public class AppException(string message, int statusCode = 400) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message, 404) { }
    public NotFoundException(string entity, object key) : base($"{entity} with id '{key}' was not found.", 404) { }
}

public class UnauthorizedException(string message = "Unauthorized.")
    : AppException(message, 401);

public class ForbiddenException(string message = "Access denied.")
    : AppException(message, 403);
