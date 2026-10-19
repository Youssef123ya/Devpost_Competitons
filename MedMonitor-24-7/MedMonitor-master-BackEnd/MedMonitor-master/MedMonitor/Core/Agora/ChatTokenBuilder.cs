namespace MedMonitor.Core.Agora
{
    public class ChatTokenBuilder
    {
        public static string buildUserToken(string appId, string appCertificate, string userId, uint expire)
        {
            AccessToken accessToken = new AccessToken(appId, appCertificate, expire);
            AccessToken.Service serviceChat = new AccessToken.ServiceChat(userId);

            serviceChat.addPrivilegeChat(AccessToken.PrivilegeChatEnum.PRIVILEGE_CHAT_USER, expire);
            accessToken.addService(serviceChat);

            return accessToken.build();
        }
        public static string buildAppToken(string appId, string appCertificate, uint expire)
        {
            AccessToken accessToken = new AccessToken(appId, appCertificate, expire);
            AccessToken.Service serviceChat = new AccessToken.ServiceChat();

            serviceChat.addPrivilegeChat(AccessToken.PrivilegeChatEnum.PRIVILEGE_CHAT_APP, expire);
            accessToken.addService(serviceChat);

            return accessToken.build();
        }
    }
}
