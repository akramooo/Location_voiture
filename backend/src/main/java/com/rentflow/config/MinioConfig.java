package com.rentflow.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class MinioConfig {

    @Value("${minio.endpoint:http://localhost:9000}")
    private String endpoint;

    @Value("${minio.access-key:minioadmin}")
    private String accessKey;

    @Value("${minio.secret-key:minioadmin123}")
    private String secretKey;

    @Value("${minio.bucket-name:rentflow-media}")
    private String bucketName;

    private String getSanitizedEndpoint() {
        if (endpoint == null || endpoint.isBlank()) {
            return "http://localhost:9000";
        }
        String clean = endpoint.trim();
        if (clean.startsWith("http://:")) {
            clean = clean.replace("http://:", "http://localhost:");
        } else if (clean.startsWith("https://:")) {
            clean = clean.replace("https://:", "https://localhost:");
        } else if (clean.startsWith(":")) {
            clean = "http://localhost" + clean;
        } else if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
            clean = "http://" + clean;
        }
        return clean;
    }

    @Bean
    public MinioClient minioClient() {
        String safeEndpoint = getSanitizedEndpoint();
        try {
            MinioClient client = MinioClient.builder()
                    .endpoint(safeEndpoint)
                    .credentials(accessKey, secretKey)
                    .build();

            // Vérification et création automatique du bucket au démarrage
            boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info(">>> Bucket MinIO '{}' créé avec succès.", bucketName);

                // Politique d'accès en lecture publique pour les photos et documents
                String policyJson = """
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": {"AWS": ["*"]},
                                    "Action": ["s3:GetObject"],
                                    "Resource": ["arn:aws:s3:::%s/*"]
                                }
                            ]
                        }
                        """.formatted(bucketName);

                client.setBucketPolicy(
                        SetBucketPolicyArgs.builder()
                                .bucket(bucketName)
                                .config(policyJson)
                                .build()
                );
            } else {
                log.info(">>> Bucket MinIO '{}' déjà existant et opérationnel.", bucketName);
            }

            return client;
        } catch (Exception e) {
            log.warn(">>> Attention: Impossible d'initialiser MinIO au démarrage ({}). Le mode stockage de secours sera activé.", e.getMessage());
            // Retourne un client minimaliste sans crasher l'application
            try {
                return MinioClient.builder()
                        .endpoint(safeEndpoint)
                        .credentials(accessKey, secretKey)
                        .build();
            } catch (Exception fallbackEx) {
                log.warn(">>> Fallback MinIO client initialization failed: {}. Using localhost default.", fallbackEx.getMessage());
                return MinioClient.builder()
                        .endpoint("http://localhost:9000")
                        .credentials("minioadmin", "minioadmin123")
                        .build();
            }
        }
    }
}
