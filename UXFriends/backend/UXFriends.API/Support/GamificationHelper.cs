using UXFriends.Domain.Entities;

namespace UXFriends.API.Support;

public static class GamificationHelper
{
    public static void ApplyXp(User user, int xpAmount)
    {
        if (xpAmount <= 0)
        {
            return;
        }

        user.TotalXP += xpAmount;
        user.CurrentXP += xpAmount;

        while (user.CurrentXP >= user.NextLevelXP)
        {
            user.CurrentXP -= user.NextLevelXP;
            user.Level += 1;
            user.NextLevelXP = CalculateNextLevelXp(user.Level);
        }
    }

    public static int CalculateNextLevelXp(int level) =>
        1000 + Math.Max(level - 1, 0) * 250;
}
