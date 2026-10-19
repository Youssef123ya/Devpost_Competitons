using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public sealed record LocalizedProjectContent(
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    string RequirementsAr,
    string RequirementsEn
);

public static class ProjectLocalization
{
    public static LocalizedProjectContent GetContent(
        string projectCode,
        string titleEn,
        string descriptionEn,
        string requirementsEn)
    {
        var project = CourseBlueprintCatalog.FindProject(projectCode);
        if (project is not null)
        {
            return new LocalizedProjectContent(
                project.TitleAr,
                project.TitleEn,
                project.DescriptionAr,
                project.DescriptionEn,
                project.RequirementsAr,
                project.RequirementsEn);
        }

        return new LocalizedProjectContent(
            titleEn,
            titleEn,
            descriptionEn,
            descriptionEn,
            requirementsEn,
            requirementsEn);
    }
}
