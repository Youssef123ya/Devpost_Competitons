using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Caching.Memory;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text;
using System.Net.Http.Headers;
using UXFriends.Infrastructure.Data;
using UXFriends.Application.DTOs.Auth;
using UXFriends.API.DTOs;
using UXFriends.Domain.Entities;
using UXFriends.Application.Services;
using UXFriends.API.Support;

namespace UXFriends.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UXFriendsDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UXFriendsDbContext context, 
            IConfiguration configuration,
            IEmailService emailService,
            IHttpClientFactory httpClientFactory,
            IMemoryCache memoryCache,
            ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _httpClientFactory = httpClientFactory;
            _memoryCache = memoryCache;
            _logger = logger;
        }

        private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
        private static string NormalizeLanguage(string? language) =>
            string.Equals(language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "ar";
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
        private string AuthCookieName => (_configuration["Auth:CookieName"] ?? "uxfriends_auth").Trim();

        private object CreateUserResponse(User user)
        {
            return new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                level = user.Level,
                totalXP = user.TotalXP,
                currentXP = user.CurrentXP,
                nextLevelXP = user.NextLevelXP,
                currentStreak = user.CurrentStreak,
                longestStreak = user.LongestStreak,
                coins = user.Coins,
                lessonsCompleted = user.LessonsCompleted,
                projectsCompleted = user.ProjectsCompleted,
                challengesWon = user.ChallengesWon,
                avatar = user.Avatar,
                hasCompletedOnboarding = user.HasCompletedOnboarding,
                learningGoal = user.LearningGoal,
                skillLevel = user.SkillLevel,
                weeklyDays = user.WeeklyDays,
                dailyMinutes = user.DailyMinutes,
                preferredLanguage = NormalizeLanguage(user.PreferredLanguage),
                emailConfirmed = user.EmailConfirmed,
                createdAt = user.CreatedAt,
                emailVerificationDeadline = EmailVerificationPolicy.GetDeadlineUtc(user)
            };
        }

        private object CreateEmailVerificationStatusResponse(User user)
        {
            var serverNow = DateTime.UtcNow;

            return new
            {
                email = user.Email,
                emailConfirmed = user.EmailConfirmed,
                createdAt = user.CreatedAt,
                emailVerificationDeadline = EmailVerificationPolicy.GetDeadlineUtc(user),
                serverNow
            };
        }

        private bool ShouldExposeDevelopmentVerificationLink() =>
            string.Equals(_configuration["Email:Mode"], "Development", StringComparison.OrdinalIgnoreCase);

        private object CreateEmailVerificationSendResponse(User user, string message, string? verificationUrl)
        {
            return new
            {
                message,
                status = CreateEmailVerificationStatusResponse(user),
                developmentVerificationUrl = ShouldExposeDevelopmentVerificationLink()
                    ? verificationUrl
                    : null
            };
        }

        private async Task<string> CreateAndSendEmailVerificationAsync(User user)
        {
            var deadlineUtc = EmailVerificationPolicy.GetDeadlineUtc(user);

            var existingTokens = await _context.EmailVerificationTokens
                .Where(token => token.UserId == user.Id && !token.IsUsed)
                .ToListAsync();
            if (existingTokens.Count > 0)
            {
                _context.EmailVerificationTokens.RemoveRange(existingTokens);
            }

            var rawToken = EmailVerificationPolicy.CreateRawToken();
            var tokenEntity = new EmailVerificationToken
            {
                UserId = user.Id,
                TokenHash = EmailVerificationPolicy.HashToken(rawToken),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = deadlineUtc
            };

            _context.EmailVerificationTokens.Add(tokenEntity);
            await _context.SaveChangesAsync();

            var verificationUrl = BuildFrontendEmailVerificationUrl(user, rawToken);

            await _emailService.SendEmailVerificationAsync(
                user.Email ?? string.Empty,
                verificationUrl,
                $"{user.FirstName} {user.LastName}".Trim(),
                deadlineUtc);

            return verificationUrl;
        }

        private static object CreateQuizResponse(QuizCatalogDefinition quiz)
        {
            return new
            {
                quizCode = quiz.QuizCode,
                scope = quiz.Scope,
                sectionCode = quiz.SectionCode,
                unitCode = quiz.UnitCode,
                lessonCode = quiz.LessonCode,
                titleAr = quiz.TitleAr,
                titleEn = quiz.TitleEn,
                descriptionAr = quiz.DescriptionAr,
                descriptionEn = quiz.DescriptionEn,
                passThreshold = quiz.PassThreshold,
                xpReward = quiz.XpReward,
                timeLimitMinutes = quiz.TimeLimitMinutes,
                questions = quiz.Questions.Select(question => new
                {
                    code = question.Code,
                    promptAr = question.PromptAr,
                    promptEn = question.PromptEn,
                    optionsAr = question.OptionsAr,
                    optionsEn = question.OptionsEn,
                    hintAr = question.HintAr,
                    hintEn = question.HintEn,
                    relatedLessonCode = question.RelatedLessonCode,
                    questionType = question.QuestionType,
                    optionVisualKeys = question.OptionVisualKeys
                })
            };
        }

        private static string DeterminePlacementSkillLevel(int correctAnswers) =>
            correctAnswers switch
            {
                >= 14 => "advanced",
                >= 8 => "intermediate",
                _ => "beginner"
            };

        private static string BuildPlacementSeed(User user) =>
            $"{user.Id}:{user.CreatedAt:O}:{user.Email}";

        private static void ClearLegacyOnboardingPreferences(User user)
        {
            user.LearningGoal = null;
            user.WeeklyDays = null;
            user.DailyMinutes = null;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(_context, DateTime.UtcNow);

            var passwordValidationError = PasswordRules.Validate(dto.Password);
            if (passwordValidationError is not null)
            {
                return BadRequest(new { message = passwordValidationError });
            }

            var normalizedEmail = NormalizeEmail(dto.Email);
            var normalizedEmailLookup = normalizedEmail.ToUpperInvariant();

            if (await _context.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmailLookup))
            {
                return Conflict(new { message = "Email already registered" });
            }

            var user = new User
            {
                UserName = normalizedEmail,
                NormalizedUserName = normalizedEmailLookup,
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = normalizedEmail,
                NormalizedEmail = normalizedEmailLookup,
                HasCompletedOnboarding = false,
                PreferredLanguage = NormalizeLanguage(dto.PreferredLanguage)
            };

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            string? developmentVerificationUrl = null;
            var verificationEmailSent = true;

            try
            {
                var verificationUrl = await CreateAndSendEmailVerificationAsync(user);
                developmentVerificationUrl = ShouldExposeDevelopmentVerificationLink()
                    ? verificationUrl
                    : null;
            }
            catch (Exception ex)
            {
                verificationEmailSent = false;
                _logger.LogError(ex, "Could not send email verification message for {Email}", user.Email);
            }

            var token = GenerateJwtToken(user);
            AppendAuthCookie(token, dto.RememberMe);

            return Ok(new
            {
                user = CreateUserResponse(user),
                verificationEmailSent,
                developmentVerificationUrl
            });
        }

        [HttpGet("external/providers")]
        public IActionResult GetExternalProviders()
        {
            return Ok(new
            {
                google = GetExternalProviderConfiguration("google") is not null,
                github = GetExternalProviderConfiguration("github") is not null
            });
        }

        [HttpGet("external/{provider}/start")]
        public IActionResult StartExternalLogin(
            string provider,
            [FromQuery] string? language = null,
            [FromQuery] bool rememberMe = false)
        {
            var configuration = GetExternalProviderConfiguration(provider);
            if (configuration is null)
            {
                return BadRequest(new { message = $"{provider} sign-in is not configured" });
            }

            var state = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var callbackUri = GetExternalCallbackUri(provider);

            _memoryCache.Set(
                GetExternalStateCacheKey(state),
                new ExternalStateContext(NormalizeLanguage(language), rememberMe),
                TimeSpan.FromMinutes(10));

            var authorizationUrl = configuration.Provider switch
            {
                "google" => QueryHelpers.AddQueryString(configuration.AuthorizationEndpoint, new Dictionary<string, string?>
                {
                    ["client_id"] = configuration.ClientId,
                    ["redirect_uri"] = callbackUri,
                    ["response_type"] = "code",
                    ["scope"] = "openid email profile",
                    ["state"] = state,
                    ["access_type"] = "online",
                    ["prompt"] = "select_account",
                }),
                "github" => QueryHelpers.AddQueryString(configuration.AuthorizationEndpoint, new Dictionary<string, string?>
                {
                    ["client_id"] = configuration.ClientId,
                    ["redirect_uri"] = callbackUri,
                    ["scope"] = "read:user user:email",
                    ["state"] = state,
                    ["allow_signup"] = "true",
                }),
                _ => throw new InvalidOperationException($"Unsupported external provider: {provider}")
            };

            return Redirect(authorizationUrl);
        }

        [HttpGet("external/{provider}/callback")]
        public async Task<IActionResult> HandleExternalCallback(
            string provider,
            [FromQuery] string? code,
            [FromQuery] string? state,
            [FromQuery] string? error = null)
        {
            var configuration = GetExternalProviderConfiguration(provider);
            if (configuration is null)
            {
                return Redirect(BuildFrontendAuthCallbackUrl(
                    NormalizeLanguage(null),
                    provider,
                    null,
                    false,
                    "This sign-in provider is not configured."));
            }

            if (string.IsNullOrWhiteSpace(state) ||
                !_memoryCache.TryGetValue(GetExternalStateCacheKey(state), out ExternalStateContext? externalState) ||
                externalState is null)
            {
                return Redirect(BuildFrontendAuthCallbackUrl(
                    NormalizeLanguage(null),
                    provider,
                    null,
                    false,
                    "The external sign-in request has expired. Please try again."));
            }

            _memoryCache.Remove(GetExternalStateCacheKey(state));

            if (!string.IsNullOrWhiteSpace(error))
            {
                return Redirect(BuildFrontendAuthCallbackUrl(
                    externalState.Language,
                    provider,
                    null,
                    externalState.RememberMe,
                    "The external sign-in request was cancelled."));
            }

            if (string.IsNullOrWhiteSpace(code))
            {
                return Redirect(BuildFrontendAuthCallbackUrl(
                    externalState.Language,
                    provider,
                    null,
                    externalState.RememberMe,
                    "The external sign-in response was incomplete."));
            }

            try
            {
                var userInfo = await FetchExternalUserInfoAsync(configuration, code, GetExternalCallbackUri(provider));
                var user = await FindOrCreateExternalUserAsync(userInfo, externalState.Language);
                var exchangeCode = Convert.ToHexString(RandomNumberGenerator.GetBytes(24));

                _memoryCache.Set(
                    GetExternalExchangeCacheKey(provider, exchangeCode),
                    new ExternalExchangePayload(user.Id, GenerateJwtToken(user)),
                    TimeSpan.FromMinutes(2));

                return Redirect(BuildFrontendAuthCallbackUrl(
                    externalState.Language,
                    provider,
                    exchangeCode,
                    externalState.RememberMe));
            }
            catch (ExternalAuthException ex)
            {
                return Redirect(BuildFrontendAuthCallbackUrl(
                    externalState.Language,
                    provider,
                    null,
                    externalState.RememberMe,
                    ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected {Provider} sign-in failure", configuration.Provider);
                return Redirect(BuildFrontendAuthCallbackUrl(
                    externalState.Language,
                    configuration.Provider,
                    null,
                    externalState.RememberMe,
                    "The external sign-in service is temporarily unavailable. Please try again."));
            }
        }

        [HttpPost("external/{provider}/exchange")]
        public async Task<IActionResult> ExchangeExternalCode(
            string provider,
            [FromBody] ExternalExchangeRequest request)
        {
            await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(_context, DateTime.UtcNow);

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Missing exchange code" });
            }

            if (!_memoryCache.TryGetValue(
                    GetExternalExchangeCacheKey(provider, request.Code),
                    out ExternalExchangePayload? payload) ||
                payload is null)
            {
                return BadRequest(new { message = "This sign-in link has expired. Please try again." });
            }

            _memoryCache.Remove(GetExternalExchangeCacheKey(provider, request.Code));

            var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == payload.UserId);
            if (user is null)
            {
                return NotFound(new { message = "User not found" });
            }

            AppendAuthCookie(payload.Token, request.RememberMe);

            return Ok(new
            {
                user = CreateUserResponse(user)
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(_context, DateTime.UtcNow);

            var normalizedEmail = NormalizeEmail(dto.Email);
            var normalizedEmailLookup = normalizedEmail.ToUpperInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmailLookup);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            AppendAuthCookie(token, dto.RememberMe);

            return Ok(new
            {
                user = CreateUserResponse(user)
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            ClearAuthCookie();
            return Ok(new { success = true });
        }

        // ✅ NEW: Forgot Password - Send Code
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(_context, DateTime.UtcNow);

            var normalizedEmail = NormalizeEmail(dto.Email);
            var normalizedEmailLookup = normalizedEmail.ToUpperInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmailLookup);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "This email is not registered.",
                    code = "email_not_registered"
                });
            }

            var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

            // Delete any existing unused tokens for this user
            var existingTokens = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.Id && !t.IsUsed)
                .ToListAsync();
            _context.PasswordResetTokens.RemoveRange(existingTokens);

            // Create new token
            var resetToken = new PasswordResetToken
            {
                UserId = user.Id,
                Code = code,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };

            _context.PasswordResetTokens.Add(resetToken);
            await _context.SaveChangesAsync();

            // Send email
            try
            {
                await _emailService.SendPasswordResetCodeAsync(
                    user.Email ?? "",
                    code,
                    $"{user.FirstName} {user.LastName}"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email send error: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Password reset email could not be sent right now."
                });
            }

            return Ok(new
            {
                message = "A reset code has been sent."
            });
        }

        // ✅ NEW: Verify Reset Code
        [HttpPost("verify-reset-code")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeDto dto)
        {
            var normalizedEmail = NormalizeEmail(dto.Email);
            var normalizedEmailLookup = normalizedEmail.ToUpperInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmailLookup);

            if (user == null)
            {
                return BadRequest(new { message = "Invalid code or email" });
            }

            var token = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => 
                    t.UserId == user.Id && 
                    t.Code == dto.Code && 
                    !t.IsUsed && 
                    t.ExpiresAt > DateTime.UtcNow);

            if (token == null)
            {
                return BadRequest(new { message = "Invalid or expired code" });
            }

            return Ok(new { message = "Code verified successfully" });
        }

        // ✅ NEW: Reset Password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var passwordValidationError = PasswordRules.Validate(dto.NewPassword);
            if (passwordValidationError is not null)
            {
                return BadRequest(new { message = passwordValidationError });
            }

            var normalizedEmail = NormalizeEmail(dto.Email);
            var normalizedEmailLookup = normalizedEmail.ToUpperInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmailLookup);

            if (user == null)
            {
                return BadRequest(new { message = "Invalid request" });
            }

            var token = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => 
                    t.UserId == user.Id && 
                    t.Code == dto.Code && 
                    !t.IsUsed && 
                    t.ExpiresAt > DateTime.UtcNow);

            if (token == null)
            {
                return BadRequest(new { message = "Invalid or expired code" });
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            // Mark token as used
            token.IsUsed = true;
            token.UsedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password reset successfully" });
        }

        [Authorize]
        [HttpPost("onboarding/start-from-scratch")]
        public async Task<IActionResult> StartFromScratch()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(new { message = "User not found" });

            if (user.HasCompletedOnboarding)
            {
                return BadRequest(new { message = "Onboarding has already been completed." });
            }

            ClearLegacyOnboardingPreferences(user);
            user.SkillLevel = "beginner";
            user.HasCompletedOnboarding = true;
            user.OnboardingCompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Onboarding completed from scratch",
                assignedLevel = user.SkillLevel,
                user = CreateUserResponse(user)
            });
        }

        [Authorize]
        [HttpGet("onboarding/assessment")]
        public async Task<IActionResult> GetOnboardingAssessment()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(new { message = "User not found" });

            if (user.HasCompletedOnboarding)
            {
                return BadRequest(new { message = "The placement assessment is only available before onboarding is completed." });
            }

            var assessment = LearningExperienceCatalog.BuildPlacementAssessment(BuildPlacementSeed(user));
            return Ok(new
            {
                serverNow = DateTime.UtcNow,
                quizCode = assessment.QuizCode,
                scope = assessment.Scope,
                sectionCode = assessment.SectionCode,
                unitCode = assessment.UnitCode,
                lessonCode = assessment.LessonCode,
                titleAr = assessment.TitleAr,
                titleEn = assessment.TitleEn,
                descriptionAr = assessment.DescriptionAr,
                descriptionEn = assessment.DescriptionEn,
                passThreshold = assessment.PassThreshold,
                xpReward = assessment.XpReward,
                timeLimitMinutes = assessment.TimeLimitMinutes,
                questions = assessment.Questions.Select(question => new
                {
                    code = question.Code,
                    promptAr = question.PromptAr,
                    promptEn = question.PromptEn,
                    optionsAr = question.OptionsAr,
                    optionsEn = question.OptionsEn,
                    hintAr = question.HintAr,
                    hintEn = question.HintEn,
                    relatedLessonCode = question.RelatedLessonCode,
                    questionType = question.QuestionType,
                    optionVisualKeys = question.OptionVisualKeys
                })
            });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(_context, DateTime.UtcNow);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return Unauthorized(new { message = "Session is no longer valid." });

            var dailyGoals = await DailyGoalEngine.SyncAsync(_context, user, DateTime.UtcNow);
            var streak = await StreakEngine.SyncAsync(_context, user, DateTime.UtcNow);
            if (dailyGoals.XpAwarded > 0 || streak.Changed)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                user = CreateUserResponse(user),
                serverNow = DateTime.UtcNow
            });
        }

        [Authorize]
        [HttpPost("onboarding/assessment/submit")]
        public async Task<IActionResult> SubmitOnboardingAssessment([FromBody] QuizSubmissionRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(new { message = "User not found" });

            if (user.HasCompletedOnboarding)
            {
                return BadRequest(new { message = "The placement assessment can only be completed once." });
            }

            var assessment = LearningExperienceCatalog.BuildPlacementAssessment(BuildPlacementSeed(user));
            var submittedAnswers = request.Answers ?? new Dictionary<string, int>();
            var totalQuestions = assessment.Questions.Count;
            var correctAnswers = assessment.Questions.Count(question =>
                submittedAnswers.TryGetValue(question.Code, out var selectedAnswer) &&
                selectedAnswer == question.CorrectOptionIndex);
            var scorePercent = totalQuestions == 0
                ? 0
                : (int)Math.Round(correctAnswers * 100d / totalQuestions);
            var assignedLevel = DeterminePlacementSkillLevel(correctAnswers);

            ClearLegacyOnboardingPreferences(user);
            user.SkillLevel = assignedLevel;
            user.HasCompletedOnboarding = true;
            user.OnboardingCompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                assignedLevel,
                scorePercent,
                correctAnswers,
                totalQuestions,
                user = CreateUserResponse(user)
            });
        }

        [Authorize]
        [HttpGet("email-verification/status")]
        public async Task<IActionResult> GetEmailVerificationStatus()
        {
            await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(_context, DateTime.UtcNow);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);

            if (user is null)
            {
                return Unauthorized(new { message = "Session is no longer valid." });
            }

            return Ok(CreateEmailVerificationStatusResponse(user));
        }

        [Authorize]
        [HttpPost("email-verification/send")]
        public async Task<IActionResult> SendEmailVerification()
        {
            await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(_context, DateTime.UtcNow);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);

            if (user is null)
            {
                return Unauthorized(new { message = "Session is no longer valid." });
            }

            if (user.EmailConfirmed)
            {
                return BadRequest(new { message = "Email is already verified." });
            }

            var deadlineUtc = EmailVerificationPolicy.GetDeadlineUtc(user);
            if (deadlineUtc <= DateTime.UtcNow)
            {
                return StatusCode(StatusCodes.Status410Gone, new
                {
                    message = "This account can no longer be verified because the 48-hour window has ended."
                });
            }

            try
            {
                var verificationUrl = await CreateAndSendEmailVerificationAsync(user);
                return Ok(CreateEmailVerificationSendResponse(
                    user,
                    "Verification email sent successfully.",
                    verificationUrl));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not send email verification message for {Email}", user.Email);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Verification email could not be sent right now."
                });
            }
        }

        [AllowAnonymous]
        [HttpPost("email-verification/confirm")]
        public async Task<IActionResult> ConfirmEmailVerification([FromBody] EmailVerificationConfirmRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.UserId) || string.IsNullOrWhiteSpace(request.Token))
            {
                return BadRequest(new { message = "Missing verification token." });
            }

            await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(_context, DateTime.UtcNow);

            var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == request.UserId.Trim());
            if (user is null)
            {
                return NotFound(new
                {
                    message = "This verification link is no longer valid. The account may have expired or been removed."
                });
            }

            if (user.EmailConfirmed)
            {
                return Ok(new
                {
                    alreadyVerified = true,
                    message = "Email address is already verified."
                });
            }

            if (EmailVerificationPolicy.IsExpired(user, DateTime.UtcNow))
            {
                await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(_context, DateTime.UtcNow);
                return StatusCode(StatusCodes.Status410Gone, new
                {
                    message = "This account can no longer be verified because the 48-hour window has ended."
                });
            }

            var tokenHash = EmailVerificationPolicy.HashToken(request.Token);
            var token = await _context.EmailVerificationTokens
                .FirstOrDefaultAsync(item =>
                    item.UserId == user.Id &&
                    item.TokenHash == tokenHash &&
                    !item.IsUsed &&
                    item.ExpiresAt > DateTime.UtcNow);

            if (token is null)
            {
                return BadRequest(new { message = "This verification link is invalid or has expired." });
            }

            user.EmailConfirmed = true;
            token.IsUsed = true;
            token.UsedAt = DateTime.UtcNow;

            var otherTokens = await _context.EmailVerificationTokens
                .Where(item => item.UserId == user.Id && item.Id != token.Id)
                .ToListAsync();
            if (otherTokens.Count > 0)
            {
                _context.EmailVerificationTokens.RemoveRange(otherTokens);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                alreadyVerified = false,
                message = "Email verified successfully."
            });
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(30),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private ExternalProviderConfiguration? GetExternalProviderConfiguration(string provider)
        {
            var normalizedProvider = provider.Trim().ToLowerInvariant();
            var sectionName = normalizedProvider switch
            {
                "google" => "ExternalAuth:Google",
                "github" => "ExternalAuth:GitHub",
                _ => null
            };

            if (sectionName is null)
            {
                return null;
            }

            var section = _configuration.GetSection(sectionName);
            var clientId = section["ClientId"];
            var clientSecret = section["ClientSecret"];

            if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            {
                return null;
            }

            return normalizedProvider switch
            {
                "google" => new ExternalProviderConfiguration(
                    "google",
                    clientId,
                    clientSecret,
                    "https://accounts.google.com/o/oauth2/v2/auth",
                    "https://oauth2.googleapis.com/token"),
                "github" => new ExternalProviderConfiguration(
                    "github",
                    clientId,
                    clientSecret,
                    "https://github.com/login/oauth/authorize",
                    "https://github.com/login/oauth/access_token"),
                _ => null
            };
        }

        private string GetFrontendBaseUrl() =>
            GetDeployableBaseUrl("Frontend:BaseUrl") ?? $"{Request.Scheme}://{Request.Host}";

        private string GetBackendBaseUrl() =>
            GetDeployableBaseUrl("Backend:BaseUrl") ?? $"{Request.Scheme}://{Request.Host}";

        private string? GetDeployableBaseUrl(string configurationKey)
        {
            var configuredUrl = NormalizeBaseUrl(_configuration[configurationKey]);
            if (configuredUrl is not null && (IsLocalRequestHost() || !IsLocalBaseUrl(configuredUrl)))
            {
                return configuredUrl;
            }

            return NormalizeBaseUrl(_configuration["RENDER_EXTERNAL_URL"]);
        }

        private bool IsLocalRequestHost()
        {
            var host = Request.Host.Host;
            return string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(host, "127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(host, "::1", StringComparison.OrdinalIgnoreCase);
        }

        private static string? NormalizeBaseUrl(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim().TrimEnd('/');
        }

        private static bool IsLocalBaseUrl(string value) =>
            value.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase) ||
            value.StartsWith("https://localhost", StringComparison.OrdinalIgnoreCase) ||
            value.StartsWith("http://127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
            value.StartsWith("https://127.0.0.1", StringComparison.OrdinalIgnoreCase);

        private string GetExternalCallbackUri(string provider) =>
            $"{GetBackendBaseUrl()}/api/auth/external/{provider}/callback";

        private void AppendAuthCookie(string token, bool rememberMe)
        {
            var options = new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps,
                Path = "/"
            };

            if (rememberMe)
            {
                options.Expires = DateTimeOffset.UtcNow.AddDays(30);
                options.MaxAge = TimeSpan.FromDays(30);
            }

            Response.Cookies.Append(AuthCookieName, token, options);
        }

        private void ClearAuthCookie()
        {
            Response.Cookies.Delete(AuthCookieName, new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps,
                Path = "/"
            });
        }

        private string BuildFrontendAuthCallbackUrl(
            string language,
            string provider,
            string? code,
            bool rememberMe,
            string? error = null)
        {
            var parameters = new Dictionary<string, string?>
            {
                ["provider"] = provider,
                ["lang"] = language == "en" ? "en" : null,
                ["code"] = code,
                ["remember"] = rememberMe ? "1" : null,
                ["error"] = error
            };

            return QueryHelpers.AddQueryString($"{GetFrontendBaseUrl()}/auth/callback", parameters);
        }

        private string BuildFrontendEmailVerificationUrl(User user, string token)
        {
            var parameters = new Dictionary<string, string?>
            {
                ["userId"] = user.Id,
                ["token"] = token,
                ["lang"] = NormalizeLanguage(user.PreferredLanguage) == "en" ? "en" : null
            };

            return QueryHelpers.AddQueryString($"{GetFrontendBaseUrl()}/verify-email", parameters);
        }

        private static string GetExternalStateCacheKey(string state) => $"external-auth-state:{state}";
        private static string GetExternalExchangeCacheKey(string provider, string code) =>
            $"external-auth-exchange:{provider}:{code}";

        private async Task<ExternalUserInfo> FetchExternalUserInfoAsync(
            ExternalProviderConfiguration configuration,
            string code,
            string redirectUri)
        {
            return configuration.Provider switch
            {
                "google" => await FetchGoogleUserInfoAsync(configuration, code, redirectUri),
                "github" => await FetchGitHubUserInfoAsync(configuration, code, redirectUri),
                _ => throw new ExternalAuthException("Unsupported external provider.")
            };
        }

        private async Task<ExternalUserInfo> FetchGoogleUserInfoAsync(
            ExternalProviderConfiguration configuration,
            string code,
            string redirectUri)
        {
            var client = _httpClientFactory.CreateClient();
            var tokenResponse = await client.PostAsync(
                configuration.TokenEndpoint,
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_id"] = configuration.ClientId,
                    ["client_secret"] = configuration.ClientSecret,
                    ["code"] = code,
                    ["grant_type"] = "authorization_code",
                    ["redirect_uri"] = redirectUri,
                }));

            if (!tokenResponse.IsSuccessStatusCode)
            {
                throw new ExternalAuthException("Google sign-in could not be completed.");
            }

            var tokenPayload = await tokenResponse.Content.ReadFromJsonAsync<GoogleTokenResponse>(JsonOptions);
            if (string.IsNullOrWhiteSpace(tokenPayload?.AccessToken))
            {
                throw new ExternalAuthException("Google sign-in returned an invalid token.");
            }

            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", tokenPayload.AccessToken);

            var profile = await client.GetFromJsonAsync<GoogleUserProfile>(
                "https://openidconnect.googleapis.com/v1/userinfo",
                JsonOptions);

            if (profile is null || string.IsNullOrWhiteSpace(profile.Email))
            {
                throw new ExternalAuthException("Google did not return a usable email address.");
            }

            var (firstName, lastName) = SplitName(
                profile.GivenName,
                profile.FamilyName,
                profile.Name,
                profile.Email);

            return new ExternalUserInfo(profile.Email, firstName, lastName, profile.Picture);
        }

        private async Task<ExternalUserInfo> FetchGitHubUserInfoAsync(
            ExternalProviderConfiguration configuration,
            string code,
            string redirectUri)
        {
            var client = _httpClientFactory.CreateClient();
            using var tokenRequest = new HttpRequestMessage(HttpMethod.Post, configuration.TokenEndpoint)
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_id"] = configuration.ClientId,
                    ["client_secret"] = configuration.ClientSecret,
                    ["code"] = code,
                    ["redirect_uri"] = redirectUri,
                })
            };
            tokenRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            tokenRequest.Headers.UserAgent.ParseAdd("UXFriends/1.0");

            using var tokenResponse = await client.SendAsync(tokenRequest);
            if (!tokenResponse.IsSuccessStatusCode)
            {
                throw new ExternalAuthException("GitHub sign-in could not be completed.");
            }

            var tokenPayload = await tokenResponse.Content.ReadFromJsonAsync<GitHubTokenResponse>(JsonOptions);
            if (string.IsNullOrWhiteSpace(tokenPayload?.AccessToken))
            {
                throw new ExternalAuthException("GitHub sign-in returned an invalid token.");
            }

            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", tokenPayload.AccessToken);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("UXFriends/1.0");
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

            var profile = await client.GetFromJsonAsync<GitHubUserProfile>(
                "https://api.github.com/user",
                JsonOptions);

            if (profile is null)
            {
                throw new ExternalAuthException("GitHub did not return profile details.");
            }

            var email = profile.Email;
            if (string.IsNullOrWhiteSpace(email))
            {
                var emails = await client.GetFromJsonAsync<List<GitHubEmailAddress>>(
                    "https://api.github.com/user/emails",
                    JsonOptions);

                email = emails?
                    .FirstOrDefault(item => item.Primary && item.Verified)?.Email
                    ?? emails?.FirstOrDefault(item => item.Verified)?.Email;
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ExternalAuthException(
                    "GitHub did not return a verified email address. Please add a verified primary email to your GitHub account.");
            }

            var (firstName, lastName) = SplitName(
                null,
                null,
                profile.Name,
                email);

            return new ExternalUserInfo(email, firstName, lastName, profile.AvatarUrl);
        }

        private async Task<User> FindOrCreateExternalUserAsync(
            ExternalUserInfo userInfo,
            string preferredLanguage)
        {
            var normalizedEmail = NormalizeEmail(userInfo.Email);
            var normalizedLookup = normalizedEmail.ToUpperInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(item => item.NormalizedEmail == normalizedLookup);

            if (user is null)
            {
                user = new User
                {
                    UserName = normalizedEmail,
                    NormalizedUserName = normalizedLookup,
                    Email = normalizedEmail,
                    NormalizedEmail = normalizedLookup,
                    FirstName = userInfo.FirstName,
                    LastName = userInfo.LastName,
                    Avatar = string.IsNullOrWhiteSpace(userInfo.Avatar) ? null : userInfo.Avatar,
                    HasCompletedOnboarding = false,
                    PreferredLanguage = preferredLanguage,
                    EmailConfirmed = true,
                };

                _context.Users.Add(user);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(user.Avatar) && !string.IsNullOrWhiteSpace(userInfo.Avatar))
                {
                    user.Avatar = userInfo.Avatar;
                }

                if (string.IsNullOrWhiteSpace(user.PreferredLanguage))
                {
                    user.PreferredLanguage = preferredLanguage;
                }

                user.EmailConfirmed = true;
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return user;
        }

        private static (string FirstName, string LastName) SplitName(
            string? givenName,
            string? familyName,
            string? fullName,
            string email)
        {
            if (!string.IsNullOrWhiteSpace(givenName) && !string.IsNullOrWhiteSpace(familyName))
            {
                return (givenName.Trim(), familyName.Trim());
            }

            if (!string.IsNullOrWhiteSpace(fullName))
            {
                var parts = fullName
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                if (parts.Length >= 2)
                {
                    return (parts[0], string.Join(' ', parts.Skip(1)));
                }

                if (parts.Length == 1)
                {
                    return (parts[0], "User");
                }
            }

            var localPart = email.Split('@')[0];
            var sanitized = string.IsNullOrWhiteSpace(localPart) ? "User" : localPart.Replace('.', ' ');
            var sanitizedParts = sanitized
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            if (sanitizedParts.Length >= 2)
            {
                return (sanitizedParts[0], string.Join(' ', sanitizedParts.Skip(1)));
            }

            return (sanitizedParts.FirstOrDefault() ?? "User", "User");
        }

        private sealed record ExternalProviderConfiguration(
            string Provider,
            string ClientId,
            string ClientSecret,
            string AuthorizationEndpoint,
            string TokenEndpoint);

        private sealed record ExternalStateContext(string Language, bool RememberMe);
        private sealed record ExternalExchangePayload(string UserId, string Token);
        private sealed record ExternalUserInfo(string Email, string FirstName, string LastName, string? Avatar);
        public sealed record ExternalExchangeRequest(string Code, bool RememberMe = false);
        private sealed class ExternalAuthException : Exception
        {
            public ExternalAuthException(string message) : base(message) { }
        }

        private sealed class GoogleTokenResponse
        {
            [JsonPropertyName("access_token")]
            public string? AccessToken { get; set; }
        }

        private sealed class GoogleUserProfile
        {
            public string? Email { get; set; }
            public string? Name { get; set; }

            [JsonPropertyName("given_name")]
            public string? GivenName { get; set; }

            [JsonPropertyName("family_name")]
            public string? FamilyName { get; set; }

            public string? Picture { get; set; }
        }

        private sealed class GitHubTokenResponse
        {
            [JsonPropertyName("access_token")]
            public string? AccessToken { get; set; }
        }

        private sealed class GitHubUserProfile
        {
            public string? Email { get; set; }
            public string? Name { get; set; }

            [JsonPropertyName("avatar_url")]
            public string? AvatarUrl { get; set; }
        }

        private sealed class GitHubEmailAddress
        {
            public string? Email { get; set; }
            public bool Primary { get; set; }
            public bool Verified { get; set; }
        }

        public sealed record EmailVerificationConfirmRequest(string UserId, string Token);
    }
}
