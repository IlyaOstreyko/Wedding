namespace Wedding.Security
{
    public static class AdminAuthHelper
    {
        public const string SessionKey = "AdminAccess";

        public static bool IsAuthorized(HttpContext context)
        {
            return context.Session.GetString(SessionKey) == "true";
        }

        public static void GrantAccess(HttpContext context)
        {
            context.Session.SetString(SessionKey, "true");
        }
    }
}
