using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace backend.Services
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            var cloudName = config["Cloudinary:CloudName"];
            var apiKey = config["Cloudinary:ApiKey"];
            var apiSecret = config["Cloudinary:ApiSecret"];

            if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
            {
                // If keys are missing, we log but don't crash yet
                // The actual upload will fail if keys are null
            }

            var acc = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(acc);
        }

        public async Task<string?> UploadImageAsync(IFormFile file)
        {
            if (file.Length > 0)
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "profile_pictures",
                    Transformation = new Transformation().Width(500).Height(500).Crop("fill").Gravity("face")
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    throw new Exception(uploadResult.Error.Message);
                }

                return uploadResult.SecureUrl.ToString();
            }

            return null;
        }

        public async Task<bool> DeleteImageAsync(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl)) return false;

            try
            {
                var uri = new Uri(imageUrl);
                var path = uri.AbsolutePath;
                
                var uploadSegment = "image/upload/";
                var uploadIndex = path.IndexOf(uploadSegment);
                if (uploadIndex == -1) return false;

                var relativePath = path.Substring(uploadIndex + uploadSegment.Length);
                
                var parts = relativePath.Split('/');
                var startingIndex = 0;
                if (parts.Length > 0 && parts[0].StartsWith("v") && long.TryParse(parts[0].Substring(1), out _))
                {
                    startingIndex = 1;
                }

                var publicIdPath = string.Join("/", parts.Skip(startingIndex));
                
                var dotIndex = publicIdPath.LastIndexOf('.');
                if (dotIndex != -1)
                {
                    publicIdPath = publicIdPath.Substring(0, dotIndex);
                }

                var destroyParams = new DeletionParams(publicIdPath);
                var result = await _cloudinary.DestroyAsync(destroyParams);
                return result.Result == "ok";
            }
            catch
            {
                return false;
            }
        }
    }
}
