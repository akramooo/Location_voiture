package com.rentflow.config;

import com.rentflow.domain.Role;
import com.rentflow.domain.User;
import com.rentflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Initialiser uniquement le compte Super Admin pour la gestion de la plateforme
        if (userRepository.findByUsername("superadmin").isEmpty()) {
            User superAdmin = User.builder()
                    .username("superadmin")
                    .email("master@rentflow.ma")
                    .password(passwordEncoder.encode("superadmin123"))
                    .fullName("Super Admin (Plateforme Master Maroc)")
                    .phone("+212 5 22 00 00 00")
                    .role(Role.SUPER_ADMIN)
                    .tenant(null)
                    .active(true)
                    .build();
            userRepository.save(superAdmin);
            System.out.println(">>> Compte Super Admin initialisé avec succès : superadmin / superadmin123");
        }
    }
}
