using Microsoft.AspNetCore.Authorization;
using System.Linq;

namespace backend.Middleware
{
    /// <summary>
    /// Requirement for the PermissionHandler to check against.
    /// </summary>
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }

        public PermissionRequirement(string permission)
        {
            Permission = permission;
        }
    }

    /// <summary>
    /// Checks if a user has the required permission claim in their JWT.
    /// </summary>
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            // Extract permission claims from the user's principal
            var permissions = context.User.FindAll("permission").Select(c => c.Value);

            if (permissions.Contains(requirement.Permission))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
