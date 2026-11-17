package com.shopsphere.modules.user.controller;

import com.shopsphere.common.response.ApiResponse;
import com.shopsphere.modules.user.dto.AddressRequest;
import com.shopsphere.modules.user.dto.AddressResponse;
import com.shopsphere.modules.user.dto.UserResponse;
import com.shopsphere.modules.user.service.UserService;
import com.shopsphere.security.services.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Endpoints for managing user profile and shipping addresses")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get authenticated user profile details")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        UserResponse response = userService.getCurrentUser(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/addresses")
    @Operation(summary = "Get all saved shipping addresses for current user")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<AddressResponse> addresses = userService.getUserAddresses(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping("/addresses")
    @Operation(summary = "Add a new shipping address for checkout")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody AddressRequest request) {
        AddressResponse address = userService.addAddress(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added successfully", address));
    }

    @DeleteMapping("/addresses/{id}")
    @Operation(summary = "Delete a saved address by ID")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        userService.deleteAddress(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully", null));
    }
}
