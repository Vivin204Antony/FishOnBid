package com.FishOnBid.FishOnBid_Backend.dto;

import lombok.Data;

@Data
public class UserDTO {
    private String name;
    private String email;
    private String password;
    private String role;
}
