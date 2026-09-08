package com.rentflow.service.impl;

import com.rentflow.security.TenantContext;
import com.rentflow.service.FileStorageService;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private final MinioClient minioClient;

    @Value("${minio.endpoint:http://localhost:9000}")
    private String endpoint;

    @Value("${minio.bucket-name:rentflow-media}")
    private String bucketName;

    @Override
    public Map<String, Object> uploadFile(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier envoyé est vide.");
        }

        Long tenantId = TenantContext.getCurrentTenant();
        String originalFilename = file.getOriginalFilename();
        String cleanOriginalName = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "file.dat";
        
        String cleanFolder = (folder != null && !folder.isBlank()) ? folder.trim().toLowerCase() : "general";
        String objectName = String.format("%s/tenant_%s_%s_%s", cleanFolder, tenantId != null ? tenantId : "global", UUID.randomUUID().toString().substring(0, 8), cleanOriginalName);

        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        String fileUrl;

        try {
            // Tentative d'upload sur le serveur MinIO S3
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(contentType)
                            .build()
            );

            fileUrl = String.format("%s/%s/%s", endpoint.replaceAll("/$", ""), bucketName, objectName);
            log.info(">>> Fichier stocké sur MinIO avec succès : {}", fileUrl);

        } catch (Exception e) {
            log.warn(">>> Échec envoi MinIO ({}), bascule automatique sur stockage local de secours.", e.getMessage());
            
            // Bascule sur stockage local (dossier uploads/)
            try {
                Path localDir = Paths.get("uploads", cleanFolder);
                Files.createDirectories(localDir);
                Path targetPath = localDir.resolve("tenant_" + (tenantId != null ? tenantId : "0") + "_" + cleanOriginalName);
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
                
                fileUrl = "/api/files/download/" + objectName.replace("/", "_");
            } catch (Exception ex) {
                throw new RuntimeException("Impossible d'enregistrer le fichier : " + ex.getMessage(), ex);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("url", fileUrl);
        response.put("objectName", objectName);
        response.put("fileName", cleanOriginalName);
        response.put("size", file.getSize());
        response.put("contentType", contentType);

        return response;
    }

    @Override
    public InputStream getFileStream(String objectName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.warn(">>> Fichier introuvable sur MinIO, tentative de lecture locale : {}", objectName);
            try {
                File localFile = new File("uploads/" + objectName.replace("_", "/"));
                if (localFile.exists()) {
                    return new FileInputStream(localFile);
                }
            } catch (Exception ignored) {}
            throw new RuntimeException("Fichier non trouvé : " + objectName);
        }
    }

    @Override
    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            log.info(">>> Fichier supprimé de MinIO : {}", objectName);
        } catch (Exception e) {
            log.error(">>> Erreur suppression MinIO : {}", e.getMessage());
        }
    }
}
