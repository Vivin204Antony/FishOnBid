package com.FishOnBid.FishOnBid_Backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    /**
     * Extract the public_id from a Cloudinary URL.
     * e.g. https://res.cloudinary.com/demo/video/upload/v123/fishonbid/abc123.webm
     *      → fishonbid/abc123
     */
    public String extractPublicId(String url) {
        if (url == null || !url.contains("cloudinary.com")) return null;
        try {
            // Find the part after /upload/vXXX/
            String[] parts = url.split("/upload/");
            if (parts.length < 2) return null;
            String path = parts[1];
            // Remove version prefix (v12345/)
            if (path.matches("^v\\d+/.*")) {
                path = path.substring(path.indexOf('/') + 1);
            }
            // Remove file extension
            int dotIdx = path.lastIndexOf('.');
            if (dotIdx > 0) path = path.substring(0, dotIdx);
            return path;
        } catch (Exception e) {
            log.warn("Could not extract public_id from URL: {}", url);
            return null;
        }
    }

    /**
     * Delete a video from Cloudinary using their REST API.
     */
    public boolean deleteVideo(String videoUrl) {
        if (apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            log.warn("Cloudinary API key/secret not configured — skipping delete");
            return false;
        }

        String publicId = extractPublicId(videoUrl);
        if (publicId == null) {
            log.warn("Could not extract public_id from: {}", videoUrl);
            return false;
        }

        try {
            String timestamp = String.valueOf(Instant.now().getEpochSecond());
            String toSign = "public_id=" + publicId + "&timestamp=" + timestamp;
            String signature = sha1Hex(toSign + apiSecret);

            String body = "public_id=" + URLEncoder.encode(publicId, StandardCharsets.UTF_8)
                    + "&timestamp=" + timestamp
                    + "&api_key=" + apiKey
                    + "&signature=" + signature;

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/video/destroy"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("Cloudinary delete response for {}: {}", publicId, response.body());
            return response.statusCode() == 200 && response.body().contains("\"ok\"");

        } catch (Exception e) {
            log.error("Failed to delete video from Cloudinary: {}", e.getMessage());
            return false;
        }
    }

    private String sha1Hex(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
