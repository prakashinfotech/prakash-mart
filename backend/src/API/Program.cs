using System.Text;
using System.Threading.RateLimiting;
using PrakashMart.API.Middleware;
using PrakashMart.Application;
using PrakashMart.Application.Interfaces;
using PrakashMart.Infrastructure;
using PrakashMart.Infrastructure.Persistence;
using PrakashMart.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "PrakashMart API", Version = "v1" });
    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Reference = new OpenApiReference { Id = JwtBearerDefaults.AuthenticationScheme, Type = ReferenceType.SecurityScheme }
    };
    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, jwtScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { { jwtScheme, [] } });
});

// ── JWT Auth ──────────────────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings["Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException(
        "JWT Key is not configured. Set Jwt:Key in appsettings.Development.json or the JWT_KEY environment variable.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// ── CORS ─────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
var rl = builder.Configuration.GetSection("RateLimiting");

builder.Services.AddRateLimiter(options =>
{
    // Global per-IP fixed window applied to every request
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rl.GetValue("GlobalPermitLimit", 200),
                Window = TimeSpan.FromSeconds(rl.GetValue("GlobalWindowSeconds", 60)),
            }));

    // Stricter named policy for auth endpoints (login / register)
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = rl.GetValue("AuthPermitLimit", 10);
        opt.Window = TimeSpan.FromSeconds(rl.GetValue("AuthWindowSeconds", 60));
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });

    options.OnRejected = async (ctx, token) =>
    {
        ctx.HttpContext.Response.StatusCode = 429;
        ctx.HttpContext.Response.ContentType = "application/json";
        await ctx.HttpContext.Response.WriteAsync(
            "{\"error\":\"Too many requests. Please try again later.\"}", token);
    };
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHostedService<ReservationCleanupService>();

var app = builder.Build();

// ── Migrations & Seed ─────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    db.Database.Migrate();
    await DbSeeder.SeedAsync(db, hasher);
}

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PrakashMart API v1");
    c.RoutePrefix = "swagger";
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
