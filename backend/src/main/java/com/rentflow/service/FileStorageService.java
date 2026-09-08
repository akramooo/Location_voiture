package com.rentflow.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.Map;

public interface FileStorageService {
    
    /**
     * Téléverse un fichier (image, PDF...) dans MinIO et retourne son URL accessible.
     */
    Map<String, Object> uploadFile(MultipartFile file, String folder);

    /**
     * Télécharge un flux de fichier depuis MinIO.
     */
    InputStream getFileStream(String objectName);

    /**
     * Supprime un fichier de MinIO.
     */
    void deleteFile(String objectName);
}
