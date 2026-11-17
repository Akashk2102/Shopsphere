package com.shopsphere.modules.user.service;

import com.shopsphere.modules.user.dto.*;

import java.util.List;

public interface UserService {
    AuthResponse registerUser(RegisterRequest request);
    AuthResponse authenticateUser(LoginRequest request);
    UserResponse getCurrentUser(Long userId);
    List<AddressResponse> getUserAddresses(Long userId);
    AddressResponse addAddress(Long userId, AddressRequest request);
    void deleteAddress(Long userId, Long addressId);
}
