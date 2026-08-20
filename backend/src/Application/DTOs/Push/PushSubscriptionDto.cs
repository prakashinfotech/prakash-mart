namespace PrakashMart.Application.DTOs.Push;

public record SubscribeDto(string Endpoint, string P256DH, string Auth);
public record UnsubscribeDto(string Endpoint);
