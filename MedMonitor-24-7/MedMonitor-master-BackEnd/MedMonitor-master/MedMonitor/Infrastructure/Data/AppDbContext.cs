using MedMonitor.Infrastructure.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Net.Mail;
using System.Reflection.Emit;
using System.Text.RegularExpressions;
using static MedMonitor.Core.Agora.AccessToken;
using Attachment = MedMonitor.Infrastructure.Models.Attachment;

namespace MedMonitor.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<string>, string>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public virtual DbSet<Attachment> Attachments { get; set; } = null!;
        public virtual DbSet<Bed> Beds { get; set; } = null!;
        public virtual DbSet<MedMonitor.Infrastructure.Models.Task> Tasks { get; set; } = null!;
        public virtual DbSet<AdmissionRequest> AdmissionRequests { get; set; } = null!;
        public virtual DbSet<VitalSign> VitalSigns { get; set; } = null!;
        public virtual DbSet<Notification> Notifications { get; set; } = null!;
        public virtual DbSet<PatientAlertState> PatientAlertStates { get; set; } = null!;
        public virtual DbSet<ChatMessage> ChatMessages { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Attachment>(entity =>
            {
                entity.HasOne(x => x.User)
                      .WithMany(u => u.Attachments)
                      .HasForeignKey(x => x.UserId)
                      .OnDelete(DeleteBehavior.ClientNoAction);
            });

            modelBuilder.Entity<Bed>(entity =>
            {
                // ✅ Patient data now stored directly on Bed model (PatientName, PatientAge, etc.)
                // No longer has foreign key relationship to User
            });

            modelBuilder.Entity<MedMonitor.Infrastructure.Models.Task>(entity =>
            {
                entity.HasOne(t => t.Doctor)
                      .WithMany(u => u.TasksAsDoctor)
                      .HasForeignKey(t => t.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.Nurse)
                      .WithMany(u => u.TasksAsNurse)
                      .HasForeignKey(t => t.NurseId)
                      .OnDelete(DeleteBehavior.Restrict);

                    entity.HasOne(t => t.Patient)
                        .WithMany()
                        .HasForeignKey(t => t.PatientId)
                        .OnDelete(DeleteBehavior.SetNull);

            });

            modelBuilder.Entity<AdmissionRequest>(entity =>
            {
                entity.HasOne(r => r.Doctor)
                      .WithMany(u => u.Requests)
                      .HasForeignKey(r => r.DoctorId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasOne(n => n.Nurse)
                      .WithMany()
                      .HasForeignKey(n => n.NurseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
