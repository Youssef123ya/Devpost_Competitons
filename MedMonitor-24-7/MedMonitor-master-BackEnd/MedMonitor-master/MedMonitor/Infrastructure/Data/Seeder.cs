using MedMonitor.Infrastructure.Models;
using MedMonitor.Shared.Enum;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace MedMonitor.Infrastructure.Data
{
    public static class Seeder
    {
        public static async System.Threading.Tasks.Task Seed(AppDbContext dbContext, UserManager<User> userManager)
        {
            var transaction = dbContext.Database.IsInMemory()
                ? null
                : await dbContext.Database.BeginTransactionAsync();
            try
            {

                await dbContext.SaveChangesAsync();
                if (await dbContext.Users.AnyAsync())
                {
                    if (!await dbContext.Users.AnyAsync(u => u.UserName == "superadmin"))
                    {
                        var superAdminExisting = new User
                        {
                            Id = Guid.NewGuid().ToString(),
                            FullName = "Super Admin",
                            UserName = "superadmin",
                            Email = "admin@medmonitor.com",
                            PhoneNumber = "01000000000",
                            IsActive = true,
                            EmailConfirmed = true,
                            Role = UserRoleEnum.SuperAdmin,
                        };

                        await userManager.CreateAsync(superAdminExisting, "Admin@123456");
                    }

                    if (!await dbContext.Users.AnyAsync(u => u.UserName == "doctor1"))
                    {
                        var doctorExisting = new User
                        {
                            Id = Guid.NewGuid().ToString(),
                            FullName = "Doctor One",
                            UserName = "doctor1",
                            Email = "doctor1@example.com",
                            PhoneNumber = "01111222333",
                            IsActive = true,
                            EmailConfirmed = true,
                            Role = UserRoleEnum.Doctor,
                        };

                        await userManager.CreateAsync(doctorExisting, "123456");
                    }

                    if (!await dbContext.Users.AnyAsync(u => u.UserName == "nurse1"))
                    {
                        var nurseExisting = new User
                        {
                            Id = Guid.NewGuid().ToString(),
                            FullName = "Nurse One",
                            UserName = "nurse1",
                            Email = "nurse1@example.com",
                            PhoneNumber = "01222333444",
                            IsActive = true,
                            EmailConfirmed = true,
                            Role = UserRoleEnum.Nurse,
                        };

                        await userManager.CreateAsync(nurseExisting, "123456");
                    }

                    var doctorUser = await dbContext.Users.FirstOrDefaultAsync(u => u.UserName == "doctor1");
                    if (doctorUser is not null)
                    {
                        await EnsureSampleAdmissionRequests(dbContext, doctorUser.Id);
                    }

                    // ✅ FIX: Ensure sample beds exist even on subsequent runs
                    await EnsureSampleBeds(dbContext);

                    if (transaction is not null)
                        await transaction.CommitAsync();
                    return;
                }

                var user = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    FullName = "Esraa Abdelmonem",
                    UserName = "EsraaAbdelmonem",
                    Email = "EsraaAbdelmonem@gmail.com",
                    PhoneNumber = "0123",
                    IsActive = true,
                    EmailConfirmed = true,
                };

                await userManager.CreateAsync(user, "password");

                var superAdmin = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    FullName = "Super Admin",
                    UserName = "superadmin",
                    Email = "admin@medmonitor.com",
                    PhoneNumber = "01000000000",
                    IsActive = true,
                    EmailConfirmed = true,
                    Role = UserRoleEnum.SuperAdmin,
                };

                await userManager.CreateAsync(superAdmin, "Admin@123456");

                var doctor = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    FullName = "Doctor One",
                    UserName = "doctor1",
                    Email = "doctor1@example.com",
                    PhoneNumber = "01111222333",
                    IsActive = true,
                    EmailConfirmed = true,
                    Role = UserRoleEnum.Doctor,
                };

                await userManager.CreateAsync(doctor, "123456");

                var nurse = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    FullName = "Nurse One",
                    UserName = "nurse1",
                    Email = "nurse1@example.com",
                    PhoneNumber = "01222333444",
                    IsActive = true,
                    EmailConfirmed = true,
                    Role = UserRoleEnum.Nurse,
                };

                await userManager.CreateAsync(nurse, "123456");

                //await AssignRolesToUser(dbContext, user);

                await EnsureSampleBeds(dbContext);
                await EnsureSampleAdmissionRequests(dbContext, doctor.Id);

                if (transaction is not null)
                    await transaction.CommitAsync();
            }
            catch (Exception e)
            {
                if (transaction is not null)
                    await transaction.RollbackAsync();
                Console.WriteLine(e);
                throw;
            }
        }

        private static async Task EnsureSampleBeds(AppDbContext dbContext)
        {
            if (await dbContext.Beds.AnyAsync())
                return;

            var sampleBeds = new List<Bed>();
            
            // Create all 84 beds (7 units × 12 beds)
            // Units: A, B, C, D, E, F, G
            // Bed numbers: A1, A2, ... A12
            char[] units = { 'A', 'B', 'C', 'D', 'E', 'F', 'G' };
            
            int occupiedCount = 0;
            int maxOccupied = 5; // Start with 5 occupied beds (distributed across units)
            
            foreach (char unit in units)
            {
                for (int bedNum = 1; bedNum <= 12; bedNum++)
                {
                    var bedNumber = $"{unit}{bedNum}";
                    
                    if (occupiedCount < maxOccupied)
                    {
                        sampleBeds.Add(new Bed
                        {
                            BedNumber = bedNumber,
                            Status = BedStatusEnum.Occupied,
                            PatientName = $"Patient {occupiedCount + 1}",
                            PatientAge = 40 + occupiedCount,
                            PatientIllness = new[] { "Hypertension", "Diabetes", "Asthma", "Heart Disease", "Fever" }[occupiedCount],
                            NurseName = $"Nurse {(occupiedCount % 3) + 1}",
                            AssignedDate = DateTime.UtcNow.AddDays(-(occupiedCount + 1)),
                        });
                        occupiedCount++;
                    }
                    else
                    {
                        sampleBeds.Add(new Bed
                        {
                            BedNumber = bedNumber,
                            Status = BedStatusEnum.Available,
                        });
                    }
                }
            }

            await dbContext.Beds.AddRangeAsync(sampleBeds);
            await dbContext.SaveChangesAsync();
            
            System.Diagnostics.Debug.WriteLine($"✅ SEEDED: Created {sampleBeds.Count} beds (7 units × 12 beds each)");
        }

        private static async Task EnsureSampleAdmissionRequests(AppDbContext dbContext, string doctorId)
        {
            if (await dbContext.AdmissionRequests.AnyAsync())
                return;

            var sampleRequests = new List<AdmissionRequest>
            {
                new AdmissionRequest
                {
                    DoctorId = doctorId,
                    PatientName = "Ahmed Ali",
                    Age = 42,
                    MedicalHistory = "High blood pressure",
                    Diagnosis = "Chest pain",
                    CreatedAt = DateTime.UtcNow.AddHours(-3),
                    Status = RequestStatusEnum.Pending,
                },
                new AdmissionRequest
                {
                    DoctorId = doctorId,
                    PatientName = "Sara Hassan",
                    Age = 30,
                    MedicalHistory = "Asthma",
                    Diagnosis = "Shortness of breath",
                    CreatedAt = DateTime.UtcNow.AddHours(-1),
                    Status = RequestStatusEnum.Pending,
                }
            };

            await dbContext.AddRangeAsync(sampleRequests);
            await dbContext.SaveChangesAsync();
        }

        //private static async Task AssignRolesToUser(AppDbContext dbContext, User user)
        //{
        //    var rolesIds = await dbContext.Roles.Select(a => a.Id).ToListAsync();
        //    user.Roles = new List<UserRole>(rolesIds.Select(roleId => new UserRole()
        //    {
        //        RoleId = roleId
        //    }));

        //    await dbContext.SaveChangesAsync();
        //}
    }
}
