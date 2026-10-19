using System.Security.Claims;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UXFriends.API.Support;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AIController : ControllerBase
{
    private const int MaxStoredChatMessages = 16;
    private static readonly JsonSerializerOptions ChatJsonOptions = new(JsonSerializerDefaults.Web);
    private readonly UXFriendsDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AIController> _logger;

    public AIController(
        UXFriendsDbContext context,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<AIController> logger)
    {
        _context = context;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var snapshot = await BuildSnapshotAsync();
        if (snapshot is null)
        {
            return Unauthorized();
        }

        var reviewTopics = BuildReviewTopics(snapshot.Sections, snapshot.Mistakes);
        var reviewBank = BuildReviewBank(snapshot.Mistakes);
        var focusSection = snapshot.Sections
            .Where(section => section.RemainingLessons > 0)
            .OrderByDescending(section => section.Progress)
            .ThenBy(section => section.RemainingLessons)
            .FirstOrDefault();
        var weakestSection = snapshot.Sections
            .Where(section => section.RemainingLessons > 0)
            .OrderBy(section => section.Progress)
            .ThenByDescending(section => section.RemainingMinutes)
            .FirstOrDefault();
        var challenge = CatalogContent.Challenges.FirstOrDefault(item =>
            !snapshot.CompletedChallengeCodes.Contains(item.Code));

        var recommendations = new List<object>();
        var primaryReviewTopic = reviewTopics.FirstOrDefault();
        if (primaryReviewTopic is not null)
        {
            recommendations.Add(new
            {
                id = $"review-{primaryReviewTopic.Code}",
                type = "revision",
                titleAr = "راجع آخر نقطة أخطأت فيها",
                titleEn = "Review your latest weak spot",
                descriptionAr = primaryReviewTopic.ReasonAr,
                descriptionEn = primaryReviewTopic.ReasonEn,
                priority = primaryReviewTopic.Severity,
                estimatedMinutes = primaryReviewTopic.EstimatedMinutes,
                xpReward = XpEconomy.GetRevisionRecommendationReward(primaryReviewTopic.EstimatedMinutes),
                destinationPage = "revision-plan",
                destinationContext = new
                {
                    focusSectionCode = primaryReviewTopic.Code
                }
            });
        }

        if (focusSection?.NextLesson is not null)
        {
            recommendations.Add(new
            {
                id = $"lesson-{focusSection.NextLesson.Code}",
                type = "lesson",
                titleAr = "أكمل الدرس التالي",
                titleEn = "Complete the next lesson",
                descriptionAr = $"الخطوة المنطقية التالية هي درس \"{focusSection.NextLesson.TitleAr}\" داخل مسار \"{focusSection.TitleAr}\".",
                descriptionEn = $"Your best next step is \"{focusSection.NextLesson.TitleEn}\" inside the \"{focusSection.TitleEn}\" path.",
                priority = "high",
                estimatedMinutes = focusSection.NextLesson.DurationMinutes,
                xpReward = focusSection.NextLesson.XpReward,
                destinationPage = "lesson-player",
                destinationContext = new
                {
                    sectionCode = focusSection.Code,
                    unitCode = focusSection.NextLesson.UnitCode,
                    lessonCode = focusSection.NextLesson.Code
                }
            });
        }

        if (primaryReviewTopic is null && weakestSection is not null)
        {
            recommendations.Add(new
            {
                id = $"revision-{weakestSection.Code}",
                type = "revision",
                titleAr = "راجع أضعف مسار لديك",
                titleEn = "Review your weakest path",
                descriptionAr = BuildReasonAr(weakestSection),
                descriptionEn = BuildReasonEn(weakestSection),
                priority = weakestSection.Severity,
                estimatedMinutes = weakestSection.RemainingMinutes,
                xpReward = XpEconomy.GetRevisionRecommendationReward(Math.Max(weakestSection.RemainingMinutes, 10)),
                destinationPage = "revision-plan",
                destinationContext = new
                {
                    focusSectionCode = weakestSection.Code
                }
            });
        }

        if (challenge is not null)
        {
            recommendations.Add(new
            {
                id = $"challenge-{challenge.Code}",
                type = "challenge",
                titleAr = "جرّب تحدياً نشطاً",
                titleEn = "Try an active challenge",
                descriptionAr = $"تحدي \"{challenge.TitleAr}\" ما زال متاحاً ويمكنه دعم تقدمك الحالي.",
                descriptionEn = $"The \"{challenge.TitleEn}\" challenge is still active and can support your current progress.",
                priority = "medium",
                estimatedMinutes = Math.Max(10, challenge.DurationHours * 60 / 4),
                xpReward = challenge.XpReward,
                destinationPage = "challenge-detail",
                destinationContext = new
                {
                    challengeCode = challenge.Code
                }
            });
        }

        return Ok(new
        {
            stats = new
            {
                level = snapshot.User.Level,
                streak = snapshot.User.CurrentStreak,
                bestPerformance = snapshot.Sections.Count == 0 ? 0 : snapshot.Sections.Max(item => item.Progress),
                weakAreasCount = reviewTopics.Count
            },
            strengths = snapshot.Sections
                .Where(item => item.Progress > 0)
                .OrderByDescending(item => item.Progress)
                .Take(3)
                .Select(item => new
                {
                    code = item.Code,
                    titleAr = item.TitleAr,
                    titleEn = item.TitleEn,
                    progress = item.Progress
                }),
            weakTopics = reviewTopics
                .Take(6)
                .Select(BuildReviewTopicPayload),
            mistakes = reviewBank
                .Select(BuildMistakePayload),
            recommendedNextStep = recommendations.FirstOrDefault(),
            recommendations,
            recentActivity = snapshot.XpLogs
                .OrderByDescending(item => item.CreatedAt)
                .Take(4)
                .Select(BuildActivityPayload)
                .Where(item => item is not null)
        });
    }

    [HttpGet("revision")]
    public async Task<IActionResult> GetRevisionOverview()
    {
        var snapshot = await BuildSnapshotAsync();
        if (snapshot is null)
        {
            return Unauthorized();
        }

        return Ok(BuildRevisionOverviewPayload(snapshot));
    }

    [HttpPost("revision/update")]
    public async Task<IActionResult> UpdateRevisionPlan()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var nowUtc = DateTime.UtcNow;
        _context.XPLogs.Add(new XPLog
        {
            LogCode = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            XP = 0,
            ActivityType = "RevisionPlanUpdated",
            ReferenceId = nowUtc.ToString("O"),
            CreatedAt = nowUtc
        });

        await _context.SaveChangesAsync();

        var snapshot = await BuildSnapshotAsync();
        if (snapshot is null)
        {
            return Unauthorized();
        }

        return Ok(BuildRevisionOverviewPayload(snapshot));
    }

    [HttpPost("revision/session/complete")]
    public async Task<IActionResult> CompleteRevisionSession([FromBody] RevisionSessionCompletionRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var topicCodes = (request.TopicCodes ?? [])
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var totalQuestions = Math.Max(0, request.TotalQuestions);
        var correctAnswers = Math.Clamp(request.CorrectAnswers, 0, totalQuestions);
        var scorePercent = Math.Clamp(request.ScorePercent, 0, 100);

        if (totalQuestions == 0)
        {
            return BadRequest(new { message = "A revision session must contain at least one question." });
        }

        var primaryTopicCode = topicCodes.FirstOrDefault();
        var nowUtc = DateTime.UtcNow;
        var xpAwarded = CalculateRevisionSessionXp(scorePercent, correctAnswers, totalQuestions);

        if (xpAwarded > 0)
        {
            GamificationHelper.ApplyXp(user, xpAwarded);
        }

        _context.XPLogs.Add(new XPLog
        {
            LogCode = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            XP = xpAwarded,
            ActivityType = "RevisionSessionCompleted",
            ReferenceId = BuildRevisionReference(primaryTopicCode, scorePercent),
            CreatedAt = nowUtc
        });

        await _context.SaveChangesAsync();
        var badgesAwarded = await BadgeSyncEngine.SyncAsync(_context, user, nowUtc);
        if (badgesAwarded > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            xpAwarded,
            level = user.Level,
            totalXP = user.TotalXP,
            currentXP = user.CurrentXP,
            nextLevelXP = user.NextLevelXP,
            revisionTopicCode = primaryTopicCode,
            completedAt = nowUtc
        });
    }

    [HttpGet("chat/session")]
    public async Task<IActionResult> GetChatSession()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var session = await _context.AIChatSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UserId == userId);

        return Ok(new
        {
            messages = DeserializeChatMessages(session?.MessagesJson),
            contextSnapshot = DeserializeContextSnapshot(session?.ContextSnapshotJson) ??
                BuildFallbackContextSnapshot(user),
            updatedAt = session?.UpdatedAt,
            maxMessages = MaxStoredChatMessages
        });
    }

    [HttpPut("chat/session")]
    public async Task<IActionResult> SaveChatSession([FromBody] ChatSessionUpdateRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var messages = SanitizeMessages(request.Messages);
        var contextSnapshot = request.ContextSnapshot ?? BuildFallbackContextSnapshot(user);
        var nowUtc = DateTime.UtcNow;

        var session = await _context.AIChatSessions
            .FirstOrDefaultAsync(item => item.UserId == userId);

        if (session is null)
        {
            session = new AIChatSession
            {
                SessionCode = Guid.NewGuid().ToString("N"),
                UserId = userId,
                CreatedAt = nowUtc
            };
            _context.AIChatSessions.Add(session);
        }

        session.MessagesJson = JsonSerializer.Serialize(messages, ChatJsonOptions);
        session.ContextSnapshotJson = JsonSerializer.Serialize(contextSnapshot, ChatJsonOptions);
        session.UpdatedAt = nowUtc;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            messages,
            contextSnapshot,
            updatedAt = session.UpdatedAt,
            maxMessages = MaxStoredChatMessages
        });
    }

    [HttpDelete("chat/session")]
    public async Task<IActionResult> ResetChatSession()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var session = await _context.AIChatSessions
            .FirstOrDefaultAsync(item => item.UserId == userId);

        if (session is not null)
        {
            _context.AIChatSessions.Remove(session);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true });
    }

    [HttpPost("coach/chat")]
    public async Task<IActionResult> GetCoachChatReply(
        [FromBody] JsonElement request,
        CancellationToken cancellationToken)
    {
        var geminiApiKey = _configuration["AI:Gemini:ApiKey"]?.Trim();
        if (!string.IsNullOrWhiteSpace(geminiApiKey))
        {
            var modelReply = await TryGetGeminiCoachReplyAsync(request, geminiApiKey, cancellationToken);
            return Ok(modelReply ?? BuildFallbackCoachReply(request));
        }

        var serviceBaseUrl = NormalizeServiceBaseUrl(
            _configuration["AI:CoachServiceUrl"] ?? "http://localhost:8001");
        var client = _httpClientFactory.CreateClient();

        try
        {
            using var response = await client.PostAsync(
                $"{serviceBaseUrl}/chat",
                JsonContent.Create(request),
                cancellationToken);
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return Ok(BuildFallbackCoachReply(request));
            }

            return Content(responseContent, "application/json");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "AI coach service at {ServiceBaseUrl} is unavailable", serviceBaseUrl);
            return Ok(BuildFallbackCoachReply(request));
        }
    }

    [HttpGet("coach/status")]
    public IActionResult GetCoachStatus()
    {
        var geminiConfigured = !string.IsNullOrWhiteSpace(_configuration["AI:Gemini:ApiKey"]);
        return Ok(new
        {
            provider = geminiConfigured ? "gemini" : "local-service",
            model = geminiConfigured
                ? _configuration["AI:Gemini:Model"] ?? "gemini-3.5-flash"
                : null,
            configured = geminiConfigured
        });
    }

    private async Task<CoachReplyPayload?> TryGetGeminiCoachReplyAsync(
        JsonElement request,
        string apiKey,
        CancellationToken cancellationToken)
    {
        var baseUrl = (_configuration["AI:Gemini:BaseUrl"] ??
            "https://generativelanguage.googleapis.com/v1beta/openai").Trim().TrimEnd('/');
        var model = (_configuration["AI:Gemini:Model"] ?? "gemini-3.5-flash").Trim();
        var timeoutSeconds = int.TryParse(_configuration["AI:RequestTimeoutSeconds"], out var configuredTimeout)
            ? Math.Clamp(configuredTimeout, 5, 90)
            : 30;

        var client = _httpClientFactory.CreateClient();
        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutSource.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions")
        {
            Content = JsonContent.Create(new
            {
                model,
                messages = BuildGeminiMessages(request),
                max_tokens = 420,
                temperature = 0.35
            })
        };
        requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        requestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        try
        {
            using var response = await client.SendAsync(requestMessage, timeoutSource.Token);
            var responseContent = await response.Content.ReadAsStringAsync(timeoutSource.Token);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Gemini coach request failed with status {StatusCode}: {Response}",
                    (int)response.StatusCode,
                    responseContent.Length > 600 ? responseContent[..600] : responseContent);
                return null;
            }

            using var responseDocument = JsonDocument.Parse(responseContent);
            var reply = ExtractOpenAiReply(responseDocument.RootElement);
            if (string.IsNullOrWhiteSpace(reply))
            {
                _logger.LogWarning("Gemini coach returned an empty response for model {Model}", model);
                return null;
            }

            var language = GetJsonString(request, "language") == "en" ? "en" : "ar";
            return new CoachReplyPayload(reply.Trim(), BuildSuggestedActions(language));
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("Gemini coach request timed out after {TimeoutSeconds} seconds", timeoutSeconds);
            return null;
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            _logger.LogError(ex, "Gemini coach request failed for model {Model}", model);
            return null;
        }
    }

    private static List<object> BuildGeminiMessages(JsonElement request)
    {
        var language = GetJsonString(request, "language") == "en" ? "en" : "ar";
        var responseLanguage = language == "en" ? "English" : "Arabic";
        var messages = new List<object>
        {
            new
            {
                role = "system",
                content = $"You are UXFriends AI Coach, a practical UX/UI learning mentor. Reply in {responseLanguage}. Give concise, specific, actionable guidance. Use the learner context when relevant, do not invent progress, and keep the answer under 250 words."
            }
        };

        if (request.ValueKind == JsonValueKind.Object &&
            request.TryGetProperty("overview", out var overview) &&
            overview.ValueKind == JsonValueKind.Object)
        {
            messages.Add(new
            {
                role = "system",
                content = $"Learner context from UXFriends: {Truncate(overview.GetRawText(), 12000)}"
            });
        }

        if (request.ValueKind == JsonValueKind.Object &&
            request.TryGetProperty("history", out var history) &&
            history.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in history.EnumerateArray().TakeLast(10))
            {
                var role = GetJsonString(item, "role");
                var content = GetJsonString(item, "content")?.Trim();
                if ((role == "user" || role == "assistant") && !string.IsNullOrWhiteSpace(content))
                {
                    messages.Add(new { role, content = Truncate(content, 2400) });
                }
            }
        }

        var currentMessage = GetJsonString(request, "message")?.Trim();
        messages.Add(new
        {
            role = "user",
            content = string.IsNullOrWhiteSpace(currentMessage)
                ? language == "en" ? "Help me choose my next learning step." : "ساعدني في اختيار خطوتي التعليمية التالية."
                : Truncate(currentMessage, 4000)
        });

        return messages;
    }

    private static string? ExtractOpenAiReply(JsonElement response)
    {
        if (!response.TryGetProperty("choices", out var choices) ||
            choices.ValueKind != JsonValueKind.Array ||
            choices.GetArrayLength() == 0 ||
            !choices[0].TryGetProperty("message", out var message) ||
            !message.TryGetProperty("content", out var content))
        {
            return null;
        }

        if (content.ValueKind == JsonValueKind.String)
        {
            return content.GetString();
        }

        if (content.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        return string.Join(
            "\n",
            content.EnumerateArray()
                .Select(item => item.ValueKind == JsonValueKind.Object
                    ? GetJsonString(item, "text")
                    : item.ValueKind == JsonValueKind.String
                        ? item.GetString()
                        : null)
                .Where(item => !string.IsNullOrWhiteSpace(item)));
    }

    private static string[] BuildSuggestedActions(string language) => language == "en"
        ?
        [
            "Summarize what I should review",
            "Build me a short review plan",
            "Explain the next concept",
            "Help me improve my project"
        ]
        :
        [
            "لخص لي ما يجب مراجعته",
            "ابن لي خطة مراجعة قصيرة",
            "اشرح لي المفهوم التالي",
            "ساعدني في تحسين مشروعي"
        ];

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    private static string NormalizeServiceBaseUrl(string value)
    {
        var trimmedValue = value.Trim().TrimEnd('/');
        return trimmedValue.Contains("://", StringComparison.Ordinal)
            ? trimmedValue
            : $"http://{trimmedValue}";
    }

    private static object BuildFallbackCoachReply(JsonElement request)
    {
        var message = GetJsonString(request, "message")?.Trim() ?? "";
        var language = GetJsonString(request, "language") == "en" ? "en" : "ar";
        var overview = request.TryGetProperty("overview", out var overviewElement)
            ? overviewElement
            : default;
        var titleProperty = language == "en" ? "titleEn" : "titleAr";
        var contextLine = TryGetRecommendedStepTitle(overview, titleProperty)
            ?? TryGetWeakTopicTitle(overview, titleProperty);
        var reply = language == "en"
            ? string.IsNullOrWhiteSpace(message)
                ? $"I am ready to help with {contextLine ?? "your current UX learning path"}."
                : $"I can help with that. Based on {contextLine ?? "your current UX learning path"}, start with one small action, then review the related lesson or mistake before moving forward."
            : string.IsNullOrWhiteSpace(message)
                ? $"أنا جاهز لمساعدتك في {contextLine ?? "مسارك الحالي لتعلم تجربة المستخدم"}."
                : $"يمكنني مساعدتك في ذلك. بناءً على {contextLine ?? "مسارك الحالي لتعلم تجربة المستخدم"}، ابدأ بخطوة صغيرة واحدة ثم راجع الدرس أو الخطأ المرتبط قبل الانتقال للخطوة التالية.";

        return new
        {
            reply,
            suggestedActions = BuildSuggestedActions(language)
        };
    }

    private sealed record CoachReplyPayload(string Reply, string[] SuggestedActions);

    private static string? GetJsonString(JsonElement element, string propertyName)
    {
        return element.ValueKind == JsonValueKind.Object &&
               element.TryGetProperty(propertyName, out var property) &&
               property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }

    private static string? TryGetRecommendedStepTitle(JsonElement overview, string propertyName)
    {
        return overview.ValueKind == JsonValueKind.Object &&
               overview.TryGetProperty("recommendedNextStep", out var recommendedStep) &&
               recommendedStep.ValueKind == JsonValueKind.Object
            ? GetJsonString(recommendedStep, propertyName)
            : null;
    }

    private static string? TryGetWeakTopicTitle(JsonElement overview, string propertyName)
    {
        if (overview.ValueKind != JsonValueKind.Object ||
            !overview.TryGetProperty("weakTopics", out var weakTopics) ||
            weakTopics.ValueKind != JsonValueKind.Array ||
            weakTopics.GetArrayLength() == 0)
        {
            return null;
        }

        return GetJsonString(weakTopics[0], propertyName);
    }

    private async Task<InsightSnapshot?> BuildSnapshotAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return null;
        }

        var streak = await StreakEngine.SyncAsync(_context, user, DateTime.UtcNow);
        if (streak.Changed)
        {
            await _context.SaveChangesAsync();
        }

        var progressRecords = await _context.LessonProgress
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();
        var challengeRecords = await _context.UserChallenges
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();
        var xpLogs = await _context.XPLogs
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();
        var quizAttempts = await _context.QuizAttempts
            .Where(item => item.UserId == userId)
            .Include(item => item.Answers)
            .AsNoTracking()
            .OrderByDescending(item => item.SubmittedAt)
            .ToListAsync();

        var completedLessonCodes = progressRecords
            .Where(item => item.CompletedAt is not null || item.Status == "Completed")
            .Select(item => item.LessonCode)
            .ToHashSet();

        var sections = CatalogContent.Sections
            .Select(section =>
            {
                var lessons = GetOrderedLessonsForSection(section.Code);
                var totalLessons = lessons.Count;
                var completedLessons = lessons.Count(lesson => completedLessonCodes.Contains(lesson.Code));
                var progress = totalLessons == 0
                    ? 0
                    : (int)Math.Round(completedLessons * 100d / totalLessons);
                var remainingLessons = lessons
                    .Where(lesson => !completedLessonCodes.Contains(lesson.Code))
                    .ToList();
                var nextLesson = remainingLessons.FirstOrDefault();
                var lessonCodes = lessons.Select(lesson => lesson.Code).ToHashSet();
                var lastActivityAt = progressRecords
                    .Where(item => lessonCodes.Contains(item.LessonCode))
                    .Select(item => item.CompletedAt ?? item.UpdatedAt)
                    .OrderByDescending(item => item)
                    .FirstOrDefault();

                return new SectionInsight(
                    section.Code,
                    section.TitleAr,
                    section.TitleEn,
                    progress,
                    completedLessons,
                    totalLessons,
                    remainingLessons.Count,
                    remainingLessons.Sum(item => item.DurationMinutes),
                    nextLesson,
                    lastActivityAt
                );
            })
            .Where(item => item.TotalLessons > 0)
            .ToList();

        var completedChallengeCodes = challengeRecords
            .Where(item => item.CompletedAt is not null)
            .Select(item => item.ChallengeCode)
            .ToHashSet();

        var mistakes = quizAttempts
            .SelectMany(attempt => attempt.Answers
                .Where(answer => !answer.IsCorrect)
                .Select(answer =>
                {
                    var lesson = answer.RelatedLessonCode is null
                        ? null
                        : CatalogContent.FindLesson(answer.RelatedLessonCode);
                    var unit = lesson is null ? null : CatalogContent.FindUnit(lesson.UnitCode);
                    var section = unit is null ? null : CatalogContent.FindSection(unit.SectionCode);

                    return new QuizMistakeInsight(
                        attempt.AttemptCode,
                        attempt.Scope,
                        answer.QuestionCode,
                        answer.PromptAr,
                        answer.PromptEn,
                        answer.SelectedAnswerAr,
                        answer.SelectedAnswerEn,
                        answer.CorrectAnswerAr,
                        answer.CorrectAnswerEn,
                        answer.ExplanationAr,
                        answer.ExplanationEn,
                        lesson?.Code,
                        lesson?.TitleAr,
                        lesson?.TitleEn,
                        unit?.Code,
                        unit?.TitleAr,
                        unit?.TitleEn,
                        section?.Code,
                        section?.TitleAr,
                        section?.TitleEn,
                        attempt.SubmittedAt);
                }))
            .GroupBy(item => $"{item.LessonCode ?? "general"}|{item.QuestionCode}", StringComparer.OrdinalIgnoreCase)
            .Select(group => group
                .OrderByDescending(item => item.OccurredAt)
                .First())
            .OrderByDescending(item => item.OccurredAt)
            .ToList();

        return new InsightSnapshot(user, xpLogs, sections, completedChallengeCodes, mistakes);
    }

    private static List<LessonCatalogItem> GetOrderedLessonsForSection(string sectionCode)
    {
        var units = CatalogContent.Units
            .Where(item => item.SectionCode == sectionCode)
            .OrderBy(item => item.OrderNo)
            .ToList();
        var unitOrder = units.ToDictionary(item => item.Code, item => item.OrderNo);

        return CatalogContent.Lessons
            .Where(item => unitOrder.ContainsKey(item.UnitCode))
            .OrderBy(item => unitOrder[item.UnitCode])
            .ThenBy(item => item.OrderNo)
            .ToList();
    }

    private static ChatContextSnapshot BuildFallbackContextSnapshot(User user) =>
        new(
            user.SkillLevel ?? "beginner",
            user.Level,
            user.CurrentStreak,
            user.TotalXP,
            user.LessonsCompleted,
            null,
            null,
            null,
            DateTime.UtcNow);

    private static List<ChatSessionMessagePayload> DeserializeChatMessages(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<ChatSessionMessagePayload>>(value, ChatJsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static ChatContextSnapshot? DeserializeContextSnapshot(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<ChatContextSnapshot>(value, ChatJsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private static List<ChatSessionMessagePayload> SanitizeMessages(
        IReadOnlyList<ChatSessionMessagePayload>? messages)
    {
        return (messages ?? [])
            .Where(item =>
                !string.IsNullOrWhiteSpace(item.Content) &&
                (string.Equals(item.Role, "user", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(item.Role, "assistant", StringComparison.OrdinalIgnoreCase)))
            .Select(item =>
            {
                var normalizedContent = item.Content.Trim();
                if (normalizedContent.Length > 2400)
                {
                    normalizedContent = normalizedContent[..2400];
                }

                return new ChatSessionMessagePayload(
                    string.IsNullOrWhiteSpace(item.Id)
                        ? Guid.NewGuid().ToString("N")
                        : item.Id.Trim(),
                    string.Equals(item.Role, "assistant", StringComparison.OrdinalIgnoreCase)
                        ? "assistant"
                        : "user",
                    normalizedContent,
                    item.Timestamp == default ? DateTime.UtcNow : item.Timestamp.ToUniversalTime());
            })
            .TakeLast(MaxStoredChatMessages)
            .ToList();
    }

    private static object BuildReviewTopicPayload(ReviewTopicInsight item) => new
    {
        code = item.Code,
        titleAr = item.TitleAr,
        titleEn = item.TitleEn,
        progress = item.Progress,
        severity = item.Severity,
        reasonAr = item.ReasonAr,
        reasonEn = item.ReasonEn,
        lessonsRemaining = item.LessonsRemaining,
        estimatedMinutes = item.EstimatedMinutes,
        nextLessonCode = item.NextLessonCode,
        nextLessonTitleAr = item.NextLessonTitleAr,
        nextLessonTitleEn = item.NextLessonTitleEn
    };

    private static object BuildMistakePayload(ReviewBankItem item) => new
    {
        attemptCode = item.AttemptCode,
        scope = item.Scope,
        questionCode = item.QuestionCode,
        promptAr = item.PromptAr,
        promptEn = item.PromptEn,
        selectedAnswerAr = item.SelectedAnswerAr,
        selectedAnswerEn = item.SelectedAnswerEn,
        correctAnswerAr = item.CorrectAnswerAr,
        correctAnswerEn = item.CorrectAnswerEn,
        explanationAr = item.ExplanationAr,
        explanationEn = item.ExplanationEn,
        lessonCode = item.NextLessonCode,
        lessonTitleAr = item.NextLessonTitleAr,
        lessonTitleEn = item.NextLessonTitleEn,
        unitCode = item.UnitCode,
        unitTitleAr = item.UnitTitleAr,
        unitTitleEn = item.UnitTitleEn,
        sectionCode = item.SectionCode,
        sectionTitleAr = item.SectionTitleAr,
        sectionTitleEn = item.SectionTitleEn,
        occurredAt = item.OccurredAt
    };

    private static object BuildRevisionBankPayload(ReviewBankItem item) => new
    {
        id = item.Id,
        topicCode = item.TopicCode,
        titleAr = item.TitleAr,
        titleEn = item.TitleEn,
        reasonAr = item.ReasonAr,
        reasonEn = item.ReasonEn,
        sourceAr = item.SourceAr,
        sourceEn = item.SourceEn,
        occurredAt = item.OccurredAt,
        nextLessonCode = item.NextLessonCode,
        nextLessonTitleAr = item.NextLessonTitleAr,
        nextLessonTitleEn = item.NextLessonTitleEn,
        promptAr = item.PromptAr,
        promptEn = item.PromptEn,
        optionsAr = item.OptionsAr,
        optionsEn = item.OptionsEn,
        correctOptionIndex = item.CorrectOptionIndex,
        selectedAnswerAr = item.SelectedAnswerAr,
        selectedAnswerEn = item.SelectedAnswerEn,
        correctAnswerAr = item.CorrectAnswerAr,
        correctAnswerEn = item.CorrectAnswerEn,
        explanationAr = item.ExplanationAr,
        explanationEn = item.ExplanationEn,
        questionType = item.QuestionType,
        optionVisualKeys = item.OptionVisualKeys
    };

    private static object? BuildActivityPayload(XPLog item)
    {
        if (string.Equals(item.ActivityType, "LessonCompleted", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(item.ReferenceId))
        {
            var lesson = CatalogContent.FindLesson(item.ReferenceId);
            if (lesson is null)
            {
                return null;
            }

            return new
            {
                id = item.LogCode,
                titleAr = $"أكملت درس \"{lesson.TitleAr}\"",
                titleEn = $"Completed \"{lesson.TitleEn}\"",
                occurredAt = item.CreatedAt,
                statusAr = "درس مكتمل",
                statusEn = "Lesson completed"
            };
        }

        if (string.Equals(item.ActivityType, "ChallengeCompleted", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(item.ReferenceId))
        {
            var challenge = CatalogContent.FindChallenge(item.ReferenceId);
            if (challenge is null)
            {
                return null;
            }

            return new
            {
                id = item.LogCode,
                titleAr = $"أنهيت تحدي \"{challenge.TitleAr}\"",
                titleEn = $"Completed \"{challenge.TitleEn}\" challenge",
                occurredAt = item.CreatedAt,
                statusAr = "تحدٍ مكتمل",
                statusEn = "Challenge completed"
            };
        }

        return null;
    }

    private static object BuildRevisionOverviewPayload(InsightSnapshot snapshot)
    {
        var reviewTopics = BuildReviewTopics(snapshot.Sections, snapshot.Mistakes);
        var reviewBank = BuildReviewBank(snapshot.Mistakes);
        var weeklyTarget = 3;
        var updateCount = snapshot.XpLogs.Count(item =>
            string.Equals(item.ActivityType, "RevisionPlanUpdated", StringComparison.OrdinalIgnoreCase));
        var recommendedTopics = RotateList(reviewTopics, updateCount)
            .Take(weeklyTarget)
            .ToList();
        var completedCheckIns = snapshot.XpLogs.Count(item =>
            string.Equals(item.ActivityType, "RevisionSessionCompleted", StringComparison.OrdinalIgnoreCase) &&
            item.CreatedAt >= DateTime.UtcNow.AddDays(-7));
        var orderedReviewBank = OrderReviewBank(reviewBank, updateCount)
            .Select(BuildRevisionBankPayload)
            .ToList();

        return new
        {
            weeklyGoal = new
            {
                targetSessions = weeklyTarget,
                completedSessions = Math.Min(weeklyTarget, completedCheckIns),
                progressPercent = weeklyTarget == 0
                    ? 0
                    : Math.Min(100, (int)Math.Round(Math.Min(weeklyTarget, completedCheckIns) * 100d / weeklyTarget))
            },
            recommendedTopics = recommendedTopics.Select(BuildReviewTopicPayload),
            reviewBank = orderedReviewBank,
            revisionHistory = snapshot.XpLogs
                .Where(item => string.Equals(item.ActivityType, "RevisionSessionCompleted", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(item => item.CreatedAt)
                .Take(4)
                .Select(item =>
                {
                    var (topicCode, recordedScore) = ParseRevisionReference(item.ReferenceId);
                    var topic = reviewTopics.FirstOrDefault(current =>
                        string.Equals(current.Code, topicCode, StringComparison.OrdinalIgnoreCase));
                    if (topic is null)
                    {
                        return null;
                    }

                    return new
                    {
                        id = item.LogCode,
                        titleAr = topic.TitleAr,
                        titleEn = topic.TitleEn,
                        occurredAt = item.CreatedAt,
                        score = recordedScore ?? Math.Min(100, 50 + (topic.RepeatCount * 10))
                    };
                })
                .Where(item => item is not null),
            plan = recommendedTopics.Select((topic, index) =>
            {
                var scheduledDay = DateTime.Today.AddDays(index + 1);
                return new
                {
                    key = $"{topic.Code}-{index}-{updateCount}",
                    dayLabelAr = scheduledDay.ToString("dddd", new System.Globalization.CultureInfo("ar-EG")),
                    dayLabelEn = scheduledDay.ToString("dddd", new System.Globalization.CultureInfo("en-US")),
                    topics = new[] { BuildReviewTopicPayload(topic) },
                    items = OrderReviewBank(
                            reviewBank.Where(item =>
                                string.Equals(item.TopicCode, topic.Code, StringComparison.OrdinalIgnoreCase)),
                            updateCount + index)
                        .Take(3)
                        .Select(BuildRevisionBankPayload)
                };
            })
        };
    }

    private static int CalculateRevisionSessionXp(int scorePercent, int correctAnswers, int totalQuestions)
    {
        return XpEconomy.GetRevisionSessionReward(scorePercent, correctAnswers, totalQuestions);
    }

    private static string? BuildRevisionReference(string? topicCode, int scorePercent)
    {
        if (string.IsNullOrWhiteSpace(topicCode))
        {
            return null;
        }

        return $"{topicCode.Trim()}|{Math.Clamp(scorePercent, 0, 100)}";
    }

    private static (string? TopicCode, int? ScorePercent) ParseRevisionReference(string? referenceId)
    {
        if (string.IsNullOrWhiteSpace(referenceId))
        {
            return (null, null);
        }

        var parts = referenceId.Split('|', 2, StringSplitOptions.TrimEntries);
        if (parts.Length == 0)
        {
            return (null, null);
        }

        return int.TryParse(parts.ElementAtOrDefault(1), out var scorePercent)
            ? (parts[0], Math.Clamp(scorePercent, 0, 100))
            : (parts[0], null);
    }

    private static string BuildReasonAr(SectionInsight item)
    {
        if (item.CompletedLessons == 0)
        {
            return $"لم تبدأ مسار \"{item.TitleAr}\" بعد، وما زال أمامك {item.RemainingLessons} دروس.";
        }

        if (item.LastActivityAt.HasValue && item.LastActivityAt.Value < DateTime.UtcNow.AddDays(-10))
        {
            return $"مر وقت منذ آخر مراجعة لهذا المسار، وما زال أمامك {item.RemainingLessons} دروس.";
        }

        return $"أكملت {item.CompletedLessons} من {item.TotalLessons} دروس، وما زال هذا المسار يحتاج دفعة إضافية.";
    }

    private static string BuildReasonEn(SectionInsight item)
    {
        if (item.CompletedLessons == 0)
        {
            return $"You have not started \"{item.TitleEn}\" yet, and {item.RemainingLessons} lessons are still waiting.";
        }

        if (item.LastActivityAt.HasValue && item.LastActivityAt.Value < DateTime.UtcNow.AddDays(-10))
        {
            return $"It has been a while since you reviewed this path, and {item.RemainingLessons} lessons are still waiting.";
        }

        return $"You have completed {item.CompletedLessons} of {item.TotalLessons} lessons, so this path is the clearest area to strengthen next.";
    }

    private static List<ReviewTopicInsight> BuildReviewTopics(
        IReadOnlyCollection<SectionInsight> sections,
        IReadOnlyCollection<QuizMistakeInsight> mistakes)
    {
        return mistakes
            .GroupBy(item => item.LessonCode ?? item.QuestionCode, StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                var latest = group.OrderByDescending(item => item.OccurredAt).First();
                var lesson = latest.LessonCode is null ? null : CatalogContent.FindLesson(latest.LessonCode);
                var progress = latest.SectionCode is null
                    ? 0
                    : sections.FirstOrDefault(item => item.Code == latest.SectionCode)?.Progress ?? 0;
                var repeatCount = group.Count();

                return new ReviewTopicInsight(
                    latest.LessonCode ?? latest.QuestionCode,
                    latest.LessonTitleAr ?? latest.PromptAr,
                    latest.LessonTitleEn ?? latest.PromptEn,
                    progress,
                    1,
                    Math.Max(10, lesson?.DurationMinutes ?? 15),
                    repeatCount,
                    BuildMistakeReasonAr(latest, repeatCount),
                    BuildMistakeReasonEn(latest, repeatCount),
                    latest.LessonCode,
                    latest.LessonTitleAr,
                    latest.LessonTitleEn);
            })
            .OrderByDescending(item => item.RepeatCount)
            .ThenBy(item => item.Progress)
            .ThenByDescending(item => item.EstimatedMinutes)
            .ToList();
    }

    private static List<ReviewBankItem> BuildReviewBank(
        IReadOnlyCollection<QuizMistakeInsight> mistakes)
    {
        return mistakes
            .GroupBy(item => $"{item.LessonCode ?? "general"}|{item.QuestionCode}", StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                var latest = group.OrderByDescending(item => item.OccurredAt).First();
                var repeatCount = group.Count();
                var questionSeed = LearningExperienceCatalog.FindQuestionSeed(latest.QuestionCode);
                var fallbackOptionsAr = BuildFallbackOptionsAr(latest);
                var fallbackOptionsEn = BuildFallbackOptionsEn(latest);
                var correctOptionIndex = questionSeed?.CorrectOptionIndex
                    ?? fallbackOptionsAr.FindIndex(option => string.Equals(option, latest.CorrectAnswerAr, StringComparison.OrdinalIgnoreCase));

                if (correctOptionIndex < 0)
                {
                    correctOptionIndex = 0;
                }

                return new ReviewBankItem(
                    $"{latest.LessonCode ?? "topic"}:{latest.QuestionCode}",
                    latest.AttemptCode,
                    latest.Scope,
                    latest.LessonCode ?? latest.QuestionCode,
                    latest.QuestionCode,
                    latest.LessonTitleAr ?? latest.PromptAr,
                    latest.LessonTitleEn ?? latest.PromptEn,
                    BuildMistakeReasonAr(latest, repeatCount),
                    BuildMistakeReasonEn(latest, repeatCount),
                    BuildSourceLabelAr(latest),
                    BuildSourceLabelEn(latest),
                    latest.OccurredAt,
                    latest.PromptAr,
                    latest.PromptEn,
                    questionSeed?.OptionsAr ?? fallbackOptionsAr,
                    questionSeed?.OptionsEn ?? fallbackOptionsEn,
                    correctOptionIndex,
                    latest.SelectedAnswerAr,
                    latest.SelectedAnswerEn,
                    latest.CorrectAnswerAr,
                    latest.CorrectAnswerEn,
                    latest.ExplanationAr,
                    latest.ExplanationEn,
                    questionSeed?.QuestionType ?? "single",
                    questionSeed?.OptionVisualKeys,
                    latest.LessonCode,
                    latest.LessonTitleAr,
                    latest.LessonTitleEn,
                    latest.UnitCode,
                    latest.UnitTitleAr,
                    latest.UnitTitleEn,
                    latest.SectionCode,
                    latest.SectionTitleAr,
                    latest.SectionTitleEn);
            })
            .OrderByDescending(item => item.OccurredAt)
            .ToList();
    }

    private static List<string> BuildFallbackOptionsAr(QuizMistakeInsight mistake)
    {
        var options = new List<string>();
        if (!string.IsNullOrWhiteSpace(mistake.SelectedAnswerAr))
        {
            options.Add(mistake.SelectedAnswerAr);
        }

        options.Add(mistake.CorrectAnswerAr);
        options.Add("راجع التسلسل الهرمي والوضوح قبل الاختيار");
        options.Add("اختر العنصر الأكثر تشتيتاً للانتباه");

        return options
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(4)
            .ToList();
    }

    private static List<string> BuildFallbackOptionsEn(QuizMistakeInsight mistake)
    {
        var options = new List<string>();
        if (!string.IsNullOrWhiteSpace(mistake.SelectedAnswerEn))
        {
            options.Add(mistake.SelectedAnswerEn);
        }

        options.Add(mistake.CorrectAnswerEn);
        options.Add("Review clarity and hierarchy before choosing");
        options.Add("Pick the most distracting option");

        return options
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(4)
            .ToList();
    }

    private static string BuildMistakeReasonAr(QuizMistakeInsight mistake, int repeatCount)
    {
        var repeatLabel = repeatCount > 1
            ? $"تكرر هذا الخطأ {repeatCount} مرات."
            : "ظهر هذا الخطأ مرة واحدة حتى الآن.";
        var selected = string.IsNullOrWhiteSpace(mistake.SelectedAnswerAr)
            ? "لم تختر إجابة"
            : mistake.SelectedAnswerAr;

        return $"{repeatLabel} إجابتك كانت \"{selected}\" بينما الإجابة الصحيحة هي \"{mistake.CorrectAnswerAr}\". راجع هذا المفهوم قبل المتابعة.";
    }

    private static string BuildMistakeReasonEn(QuizMistakeInsight mistake, int repeatCount)
    {
        var repeatLabel = repeatCount > 1
            ? $"You missed this concept {repeatCount} times."
            : "You have missed this concept once so far.";
        var selected = string.IsNullOrWhiteSpace(mistake.SelectedAnswerEn)
            ? "No answer selected"
            : mistake.SelectedAnswerEn;

        return $"{repeatLabel} You chose \"{selected}\" while the correct answer is \"{mistake.CorrectAnswerEn}\". Review this concept before moving on.";
    }

    private static string BuildSourceLabelAr(QuizMistakeInsight mistake)
    {
        var labels = new[] { mistake.SectionTitleAr, mistake.UnitTitleAr }
            .Where(item => !string.IsNullOrWhiteSpace(item));
        var joined = string.Join(" • ", labels!);
        return string.IsNullOrWhiteSpace(joined) ? "مراجعة ذكية" : joined;
    }

    private static string BuildSourceLabelEn(QuizMistakeInsight mistake)
    {
        var labels = new[] { mistake.SectionTitleEn, mistake.UnitTitleEn }
            .Where(item => !string.IsNullOrWhiteSpace(item));
        var joined = string.Join(" • ", labels!);
        return string.IsNullOrWhiteSpace(joined) ? "AI review" : joined;
    }

    private static List<T> RotateList<T>(IReadOnlyList<T> items, int offset)
    {
        if (items.Count == 0)
        {
            return [];
        }

        var normalizedOffset = ((offset % items.Count) + items.Count) % items.Count;
        return items
            .Skip(normalizedOffset)
            .Concat(items.Take(normalizedOffset))
            .ToList();
    }

    private static IEnumerable<ReviewBankItem> OrderReviewBank(
        IEnumerable<ReviewBankItem> items,
        int seed)
    {
        return items
            .OrderBy(item => ComputeStableOrder(item.Id, seed))
            .ThenByDescending(item => item.OccurredAt);
    }

    private static int ComputeStableOrder(string value, int seed)
    {
        unchecked
        {
            var hash = 17;
            foreach (var character in $"{seed}:{value}")
            {
                hash = (hash * 31) + character;
            }

            return hash;
        }
    }

    private sealed record InsightSnapshot(
        User User,
        List<XPLog> XpLogs,
        List<SectionInsight> Sections,
        HashSet<string> CompletedChallengeCodes,
        List<QuizMistakeInsight> Mistakes);

    private sealed record ReviewTopicInsight(
        string Code,
        string TitleAr,
        string TitleEn,
        int Progress,
        int LessonsRemaining,
        int EstimatedMinutes,
        int RepeatCount,
        string ReasonAr,
        string ReasonEn,
        string? NextLessonCode,
        string? NextLessonTitleAr,
        string? NextLessonTitleEn)
    {
        public string Severity =>
            RepeatCount >= 3 || Progress < 35 ? "high" :
            RepeatCount >= 2 || Progress < 70 ? "medium" :
            "low";
    }

    private sealed record QuizMistakeInsight(
        string AttemptCode,
        string Scope,
        string QuestionCode,
        string PromptAr,
        string PromptEn,
        string? SelectedAnswerAr,
        string? SelectedAnswerEn,
        string CorrectAnswerAr,
        string CorrectAnswerEn,
        string ExplanationAr,
        string ExplanationEn,
        string? LessonCode,
        string? LessonTitleAr,
        string? LessonTitleEn,
        string? UnitCode,
        string? UnitTitleAr,
        string? UnitTitleEn,
        string? SectionCode,
        string? SectionTitleAr,
        string? SectionTitleEn,
        DateTime OccurredAt);

    private sealed record ReviewBankItem(
        string Id,
        string AttemptCode,
        string Scope,
        string TopicCode,
        string QuestionCode,
        string TitleAr,
        string TitleEn,
        string ReasonAr,
        string ReasonEn,
        string SourceAr,
        string SourceEn,
        DateTime OccurredAt,
        string PromptAr,
        string PromptEn,
        IReadOnlyList<string> OptionsAr,
        IReadOnlyList<string> OptionsEn,
        int CorrectOptionIndex,
        string? SelectedAnswerAr,
        string? SelectedAnswerEn,
        string CorrectAnswerAr,
        string CorrectAnswerEn,
        string ExplanationAr,
        string ExplanationEn,
        string QuestionType,
        IReadOnlyList<string>? OptionVisualKeys,
        string? NextLessonCode,
        string? NextLessonTitleAr,
        string? NextLessonTitleEn,
        string? UnitCode,
        string? UnitTitleAr,
        string? UnitTitleEn,
        string? SectionCode,
        string? SectionTitleAr,
        string? SectionTitleEn);

    private sealed record SectionInsight(
        string Code,
        string TitleAr,
        string TitleEn,
        int Progress,
        int CompletedLessons,
        int TotalLessons,
        int RemainingLessons,
        int RemainingMinutes,
        LessonCatalogItem? NextLesson,
        DateTime? LastActivityAt)
    {
        public string Severity =>
            Progress < 30 ? "high" : Progress < 70 ? "medium" : "low";
    }

    public sealed class RevisionSessionCompletionRequest
    {
        public string[]? TopicCodes { get; set; }
        public string[]? ItemIds { get; set; }
        public int ScorePercent { get; set; }
        public int CorrectAnswers { get; set; }
        public int TotalQuestions { get; set; }
    }

    public sealed class ChatSessionUpdateRequest
    {
        public ChatSessionMessagePayload[]? Messages { get; set; }
        public ChatContextSnapshot? ContextSnapshot { get; set; }
    }

    public sealed record ChatSessionMessagePayload(
        string Id,
        string Role,
        string Content,
        DateTime Timestamp);

    public sealed record ChatContextSnapshot(
        string SkillLevel,
        int Level,
        int Streak,
        int TotalXp,
        int LessonsCompleted,
        string? RecommendedStepId,
        string? RecommendedStepTitle,
        string? PrimaryWeakTopicTitle,
        DateTime GeneratedAtUtc);
}
