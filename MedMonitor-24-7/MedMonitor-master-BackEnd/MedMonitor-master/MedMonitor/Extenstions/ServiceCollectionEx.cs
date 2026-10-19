using MedMonitor.Core.Business;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Business;
using MedMonitor.Infrastructure.Repositories.Interface;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;

namespace MedMonitor.Extenstions
{
    public static class ServiceCollectionEx
    {
        public static void RegisterService(this IServiceCollection services)
        {
            //Services
            services.AddTransient<IAuthService, AuthService>();
            services.AddTransient<IEmailSender, EmailSender>();
            services.AddTransient<IAttachmentsService, AttachmentsService>();
            services.AddTransient<IUsersService, UsersService>();
            services.AddTransient<IAgoraManagementService, AgoraManagementService>();
            services.AddTransient<IUserAgoraService, UserAgoraService>();
            services.AddScoped<IAdmissionRequestService, AdmissionRequestService>();
            services.AddScoped<IBedService, BedService>();
            services.AddScoped<IVitalSignService, VitalSignService>();
            services.AddScoped<ITaskService, TaskService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IAIAlertService, AIAlertService>();

            //Repositories
            services.AddTransient<IAttachmentRepository, AttachmentRepository>();
            services.AddTransient<IUserRepository, UserRepository>();

            services.AddTransient<ITaskRepository, TaskRepository>();
            services.AddTransient<IBedRepository, BedRepository>();
            services.AddTransient<IAdmissionRequestRepository, AdmissionRequestRepository>();
            services.AddTransient<IVitalSignRepository, VitalSignRepository>();

            //Unit of Work
            services.AddTransient<IUnitOfWork, UnitOfWork>();
        }

        public static async System.Threading.Tasks.Task ApplyPendingMigrationsAsync(this IServiceCollection services)
        {
            if (Environment.GetCommandLineArgs().Any(a => a.Contains("ef.dll")))
                return;
            using var serviceScope = services.BuildServiceProvider().CreateScope();
            var dbContext = serviceScope.ServiceProvider.GetService<AppDbContext>();
            if (dbContext is null)
                return;

            Console.WriteLine("Checking for pending migrations...");
            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
            if (!pendingMigrations.Any())
            {
                Console.WriteLine("No pending migrations found!");
                return;
            }

            try
            {
                Console.WriteLine("Applying pending migrations..");
                await dbContext.Database.MigrateAsync();
                Console.WriteLine("Pending migrations applied");
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
        }

        public static async System.Threading.Tasks.Task SeedDataAsync(this IServiceCollection services)
        {
            if (Environment.GetCommandLineArgs().Any(a => a.Contains("ef.dll")))
                return;
            using var serviceScope = services.BuildServiceProvider().CreateScope();
            var dbContext = serviceScope.ServiceProvider.GetService<AppDbContext>();
            if (dbContext is null)
                return;

            var userManager = serviceScope.ServiceProvider.GetService<UserManager<User>>();
            if (userManager is null)
                return;


            await Seeder.Seed(dbContext, userManager);
        }
    }
}
