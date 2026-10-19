using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public static class EmailVerificationPolicy
{
    public static readonly TimeSpan VerificationWindow = TimeSpan.FromHours(48);

    public static DateTime GetDeadlineUtc(User user) => user.CreatedAt.Add(VerificationWindow);

    public static bool IsExpired(User user, DateTime nowUtc) =>
        !user.EmailConfirmed && GetDeadlineUtc(user) <= nowUtc;

    public static string CreateRawToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes);
    }

    public static string HashToken(string token)
    {
        var normalized = token.Trim();
        var bytes = Encoding.UTF8.GetBytes(normalized);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }

    public static async Task<int> PruneExpiredUnverifiedUsersAsync(
        UXFriendsDbContext dbContext,
        DateTime nowUtc)
    {
        var expirationThreshold = nowUtc.Subtract(VerificationWindow);
        var expiredUserIds = await dbContext.Users
            .Where(user => !user.EmailConfirmed && user.CreatedAt <= expirationThreshold)
            .Select(user => user.Id)
            .ToListAsync();

        if (expiredUserIds.Count == 0)
        {
            return 0;
        }

        var projectSubmissions = await dbContext.ProjectSubmissions
            .Where(item => expiredUserIds.Contains(item.UserId))
            .ToListAsync();
        if (projectSubmissions.Count > 0)
        {
            dbContext.ProjectSubmissions.RemoveRange(projectSubmissions);
        }

        var expiredUsers = await dbContext.Users
            .Where(user => expiredUserIds.Contains(user.Id))
            .ToListAsync();

        dbContext.Users.RemoveRange(expiredUsers);
        await dbContext.SaveChangesAsync();
        return expiredUsers.Count;
    }
}
