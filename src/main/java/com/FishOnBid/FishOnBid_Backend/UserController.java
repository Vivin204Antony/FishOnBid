package com.FishOnBid.FishOnBid_Backend;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @PostMapping("/add")
    public String addUser() {
        return "User added successfully!";
    }

    @GetMapping("/test")
    public String test() {
        return "API is working fine!";
    }
}
