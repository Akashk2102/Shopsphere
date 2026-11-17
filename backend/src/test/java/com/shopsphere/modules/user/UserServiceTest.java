package com.shopsphere.modules.user;

import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.modules.user.dto.AuthResponse;
import com.shopsphere.modules.user.dto.LoginRequest;
import com.shopsphere.modules.user.dto.RegisterRequest;
import com.shopsphere.modules.user.entity.Role;
import com.shopsphere.modules.user.entity.User;
import com.shopsphere.modules.user.repository.AddressRepository;
import com.shopsphere.modules.user.repository.RoleRepository;
import com.shopsphere.modules.user.repository.UserRepository;
import com.shopsphere.modules.user.service.UserServiceImpl;
import com.shopsphere.security.jwt.JwtUtils;
import com.shopsphere.security.services.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private UserServiceImpl userService;

    private Role customerRole;
    private User user;

    @BeforeEach
    void setUp() {
        customerRole = Role.builder()
                .id(1)
                .name("ROLE_CUSTOMER")
                .description("Customer role")
                .build();

        user = User.builder()
                .id(10L)
                .email("test@shopsphere.com")
                .password("encoded_pass")
                .firstName("Test")
                .lastName("User")
                .active(true)
                .roles(new HashSet<>(Collections.singletonList(customerRole)))
                .build();
    }

    @Test
    @DisplayName("Should successfully register a new customer")
    void testRegisterUser_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@shopsphere.com")
                .password("Password@123")
                .firstName("Test")
                .lastName("User")
                .build();

        when(userRepository.existsByEmail("test@shopsphere.com")).thenReturn(false);
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode("Password@123")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("mocked.jwt.token");

        AuthResponse response = userService.registerUser(request);

        assertNotNull(response);
        assertEquals("test@shopsphere.com", response.getEmail());
        assertEquals("mocked.jwt.token", response.getToken());
        assertTrue(response.getRoles().contains("ROLE_CUSTOMER"));

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException if email already registered")
    void testRegisterUser_DuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .email("existing@shopsphere.com")
                .password("Password@123")
                .firstName("John")
                .lastName("Doe")
                .build();

        when(userRepository.existsByEmail("existing@shopsphere.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> userService.registerUser(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should authenticate user and return JWT")
    void testAuthenticateUser_Success() {
        LoginRequest request = LoginRequest.builder()
                .email("test@shopsphere.com")
                .password("Password@123")
                .build();

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("valid.jwt.token");

        AuthResponse response = userService.authenticateUser(request);

        assertNotNull(response);
        assertEquals("valid.jwt.token", response.getToken());
        assertEquals("test@shopsphere.com", response.getEmail());
    }

    @Test
    @DisplayName("Should throw BadCredentialsException on invalid password")
    void testAuthenticateUser_InvalidCredentials() {
        LoginRequest request = LoginRequest.builder()
                .email("test@shopsphere.com")
                .password("WrongPassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> userService.authenticateUser(request));
    }
}
