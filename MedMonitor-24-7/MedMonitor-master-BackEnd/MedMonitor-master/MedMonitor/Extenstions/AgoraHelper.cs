using MedMonitor.Core.Dto;
using System.Net;
using System.Text;
using System.Text.Json;

namespace MedMonitor.Extenstions
{
    public static class AgoraHelper
    {
        //public static string Authorization = "Basic MDEzY2Y4NmM4YzcxNDkyMmI5YTk1YzcxYmQ1ZTQ3YWU6ZWE1OGM4NTgxOGQ2NDhjZGE5ZWNiNGE3ZDg3YWI5ZDY=";

        public static string GenerateAuthorization()
        {
            // Customer ID
            string customerKey = "013cf86c8c714922b9a95c71bd5e47ae";
            // Customer secret
            string customerSecret = "ea58c85818d648cda9ecb4a7d87ab9d6";
            // Concatenate customer key and customer secret and use base64 to encode the concatenated string
            string plainCredential = customerKey + ":" + customerSecret;
            // Encode with base64
            var plainTextBytes = Encoding.UTF8.GetBytes(plainCredential);
            string encodedCredential = Convert.ToBase64String(plainTextBytes);
            // Create authorization header
            return "Authorization: Basic " + encodedCredential;
        }

        public static AgoraDto RequestToAgora(string action, string authorizationHeader, string Method)
        {
            // Create request object "https://api.agora.io/dev/v1/projects"
            WebRequest request = WebRequest.Create(BaseUrl.UrlAgoraProjects + "/" + action);
            request.Method = Method;
            // Add authorization header
            request.Headers.Add(authorizationHeader);
            request.ContentType = "application/json";
            WebResponse response = request.GetResponse();
            Console.WriteLine(((HttpWebResponse)response).StatusDescription);
            AgoraDto agoraDto = new AgoraDto();
            using (Stream dataStream = response.GetResponseStream())
            {
                StreamReader reader = new StreamReader(dataStream);
                string responseFromServer = reader.ReadToEnd();

                agoraDto = JsonSerializer.Deserialize<AgoraDto>(responseFromServer);
            }
            response.Close();
            return agoraDto;
        }
    }
}
